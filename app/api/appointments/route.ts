import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received appointment data:', body);

    const { clientId, serviceId, date, startTime, endTime, status = 'scheduled' } = body;

    if (!clientId || !serviceId || !date || !startTime || !endTime) {
      console.log('Missing required fields:', { clientId, serviceId, date, startTime, endTime });
      return NextResponse.json(
        { 
          error: 'Не хватает обязательных полей', 
          missing: {
            clientId: !clientId,
            serviceId: !serviceId,
            date: !date,
            startTime: !startTime,
            endTime: !endTime
          }
        }, 
        { status: 400 }
      );
    }

    const appointmentDateTime = new Date(`${date}T${startTime}:00`);

    console.log('Creating appointment with:', {
      clientId: clientId.toString(),
      serviceId: serviceId.toString(),
      appointmentDate: appointmentDateTime,
      startTime: startTime,
      endTime: endTime,
      status
    });

    // ИСПРАВЛЕНО: Убрали createdBy, он обязательный только в схеме но можем создать запись от имени первого юзера
    const firstUser = await db.user.findFirst();
    
    if (!firstUser) {
      return NextResponse.json(
        { error: 'В системе нет пользователей. Создайте пользователя через API.' },
        { status: 500 }
      );
    }

    const appointment = await db.appointment.create({
      data: {
        appointmentDate: appointmentDateTime,
        startTime: startTime,
        endTime: endTime,
        status: status.toUpperCase(),
        clientId: clientId.toString(),
        serviceId: serviceId.toString(),
        createdById: firstUser.id, // Используем ID первого пользователя
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true
          }
        }
      }
    });

    console.log('Appointment created successfully:', appointment.id);

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        date: appointment.appointmentDate.toISOString().split('T')[0],
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        client: {
          id: appointment.client.id,
          name: appointment.client.name,
          phone: appointment.client.phone,
          email: appointment.client.email,
          firstName: appointment.client.name?.split(' ')[0] || '',
          lastName: appointment.client.name?.split(' ').slice(1).join(' ') || ''
        },
        service: appointment.service
      }
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при создании записи',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    let whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Фильтр по конкретному дню
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59`);
      whereClause.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    // Фильтр по месяцу (для календаря)
    if (month) {
      const startOfMonth = new Date(month);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      whereClause.appointmentDate = {
        gte: startOfMonth,
        lt: endOfMonth
      };
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true
          }
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            licensePlate: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    });

    // Группируем по датам для календаря
    if (month) {
      const groupedByDate: { [key: string]: any[] } = {};
      
      appointments.forEach(appointment => {
        const dateKey = appointment.appointmentDate.toISOString().split('T')[0];
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        
        groupedByDate[dateKey].push({
          id: appointment.id,
          date: dateKey,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          client: {
            id: appointment.client.id,
            name: appointment.client.name,
            phone: appointment.client.phone,
            email: appointment.client.email
          },
          service: appointment.service,
          vehicle: appointment.vehicle
        });
      });

      return NextResponse.json(groupedByDate);
    }

    // Обычный список для страницы appointments
    return NextResponse.json({
      success: true,
      appointments: appointments.map(appointment => ({
        id: appointment.id,
        date: appointment.appointmentDate.toISOString().split('T')[0],
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        client: {
          id: appointment.client.id,
          name: appointment.client.name,
          phone: appointment.client.phone,
          email: appointment.client.email,
          firstName: appointment.client.name?.split(' ')[0] || '',
          lastName: appointment.client.name?.split(' ').slice(1).join(' ') || ''
        },
        service: appointment.service,
        vehicle: appointment.vehicle
      }))
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении записей' },
      { status: 500 }
    );
  }
}

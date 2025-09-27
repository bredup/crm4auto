import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received appointment data:', body);

    // Извлекаем и валидируем данные
    const { clientId, serviceId, date, startTime, endTime, status = 'scheduled' } = body;

    // Проверка обязательных полей
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

    // Формируем полную дату и время
    const appointmentDateTime = new Date(`${date}T${startTime}:00`);

    console.log('Creating appointment with:', {
      clientId: clientId.toString(),
      serviceId: serviceId.toString(),
      appointmentDate: appointmentDateTime,
      startTime: startTime,
      endTime: endTime,
      status
    });

    // Создаем запись в БД используя connect для связанных записей
    const appointment = await db.appointment.create({
      data: {
        appointmentDate: appointmentDateTime,
        startTime: startTime,
        endTime: endTime,
        status: status.toUpperCase(), // SCHEDULED, CONFIRMED и т.д.
        client: {
          connect: { id: clientId.toString() }
        },
        service: {
          connect: { id: serviceId.toString() }
        },
        createdBy: {
          connect: { id: "1" } // Нужен существующий User ID - замените на реальный
        }
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

// GET метод для получения списка записей
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let whereClause: any = {};

    // Фильтр по статусу
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Фильтр по дате
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59`);
      whereClause.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay
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
        }
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    });

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
        service: appointment.service
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

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - получить все записи
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    let whereClause: any = {};
    
    // Фильтр по статусу
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }
    
    // Фильтр по дате
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.appointmentDate = {
        gte: startDate,
        lte: endDate
      };
    } else if (month) {
      const startDate = new Date(month);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      whereClause.appointmentDate = {
        gte: startDate,
        lt: endDate
      };
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        client: true,
        vehicle: true,
        service: true
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Для страницы appointments - возвращаем массив
    if (!month) {
      // Форматируем для страницы списка
      const formattedAppointments = appointments.map(apt => ({
        id: apt.id,
        date: apt.appointmentDate.toISOString().split('T')[0],
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status.toLowerCase(),
        client: {
          id: apt.client.id,
          name: apt.client.name,
          firstName: apt.client.name.split(' ')[0] || apt.client.name,
          lastName: apt.client.name.split(' ')[1] || '',
          phone: apt.client.phone,
          email: apt.client.email
        },
        service: {
          id: apt.service.id,
          name: apt.service.name,
          price: apt.service.price,
          duration: apt.service.duration
        },
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString()
      }));

      return NextResponse.json({
        success: true,
        appointments: formattedAppointments
      });
    }

    // Для календаря - группируем по датам
    const groupedByDate: Record<string, any[]> = {};
    
    appointments.forEach(appointment => {
      const dateStr = appointment.appointmentDate.toISOString().split('T')[0];
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = [];
      }
      groupedByDate[dateStr].push({
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        client: appointment.client,
        vehicle: appointment.vehicle,
        service: appointment.service
      });
    });

    return NextResponse.json(groupedByDate);
  } catch (error) {
    console.error('❌ Ошибка получения записей:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения записей' },
      { status: 500 }
    );
  }
}

// POST - создать новую запись
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clientId, 
      vehicleId, 
      serviceId, 
      date, 
      startTime, 
      endTime, 
      status,
      notes 
    } = body;

    console.log('📝 Создание записи:', {
      clientId,
      vehicleId,
      serviceId,
      date,
      startTime,
      endTime,
      status
    });

    // Валидация обязательных полей
    if (!clientId || !serviceId || !date || !startTime || !endTime) {
      console.error('❌ Отсутствуют обязательные поля');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Обязательные поля: clientId, serviceId, date, startTime, endTime' 
        },
        { status: 400 }
      );
    }

    // Проверяем существование клиента
    const client = await db.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      console.error('❌ Клиент не найден:', clientId);
      return NextResponse.json(
        { success: false, error: 'Клиент не найден' },
        { status: 404 }
      );
    }

    // Проверяем существование услуги
    const service = await db.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      console.error('❌ Услуга не найдена:', serviceId);
      return NextResponse.json(
        { success: false, error: 'Услуга не найдена' },
        { status: 404 }
      );
    }

    // Если указан vehicleId, проверяем его
    if (vehicleId) {
      const vehicle = await db.vehicle.findUnique({
        where: { id: vehicleId }
      });

      if (!vehicle) {
        console.error('❌ Автомобиль не найден:', vehicleId);
        return NextResponse.json(
          { success: false, error: 'Автомобиль не найден' },
          { status: 404 }
        );
      }

      if (vehicle.clientId !== clientId) {
        console.error('❌ Автомобиль не принадлежит клиенту');
        return NextResponse.json(
          { success: false, error: 'Автомобиль не принадлежит выбранному клиенту' },
          { status: 400 }
        );
      }
    }

    // Получаем первого пользователя для createdById
    const firstUser = await db.user.findFirst();
    
    if (!firstUser) {
      console.error('❌ В системе нет пользователей');
      return NextResponse.json(
        { success: false, error: 'В системе нет пользователей. Создайте пользователя.' },
        { status: 400 }
      );
    }

    console.log('✅ Валидация пройдена, создаём запись...');

    // Создаём запись
    const appointment = await db.appointment.create({
      data: {
        clientId,
        vehicleId: vehicleId || null,
        serviceId,
        appointmentDate: new Date(date),
        startTime,
        endTime,
        status: status || 'SCHEDULED',
        notes: notes || null,
        createdById: firstUser.id
      },
      include: {
        client: true,
        vehicle: true,
        service: true
      }
    });

    console.log('✅ Запись создана:', appointment.id);

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Ошибка создания записи:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка создания записи',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PATCH - обновить запись
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes, date, startTime, endTime, serviceId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID записи обязателен' },
        { status: 400 }
      );
    }

    console.log('📝 Обновление записи:', id, body);

    // Формируем данные для обновления
    const updateData: any = {};
    
    if (status) updateData.status = status.toUpperCase();
    if (notes !== undefined) updateData.notes = notes;
    if (serviceId) updateData.serviceId = serviceId;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (date) updateData.appointmentDate = new Date(date);

    const appointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        vehicle: true,
        service: true
      }
    });

    console.log('✅ Запись обновлена:', appointment.id);

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('❌ Ошибка обновления записи:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления записи', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - удалить запись
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID записи обязателен' },
        { status: 400 }
      );
    }

    await db.appointment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка удаления записи:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления записи' },
      { status: 500 }
    );
  }
}

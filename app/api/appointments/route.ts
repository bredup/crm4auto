import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const where: any = {
      deletedAt: null // Исключаем удалённые записи
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            year: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Creating appointment with data:', body);

    // Валидация обязательных полей
    if (!body.clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId is required' },
        { status: 400 }
      );
    }

    if (!body.serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId is required' },
        { status: 400 }
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { success: false, error: 'date is required' },
        { status: 400 }
      );
    }

    // Преобразуем date в appointmentDate для Prisma
    const appointmentData: any = {
      clientId: body.clientId,
      serviceId: body.serviceId,
      appointmentDate: new Date(body.date),
      startTime: body.startTime || '09:00',
      endTime: body.endTime || '10:00',
      status: body.status || 'SCHEDULED',
      notes: body.notes || null,
    };

    // Добавляем vehicleId если есть
    if (body.vehicleId) {
      appointmentData.vehicleId = body.vehicleId;
    }

    console.log('Prisma appointment data:', appointmentData);

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            year: true,
          },
        },
      },
    });

    console.log('Appointment created successfully:', appointment.id);

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    
    // Детальное логирование ошибки
    if (error.code) {
      console.error('Prisma error code:', error.code);
    }
    if (error.meta) {
      console.error('Prisma error meta:', error.meta);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create appointment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Fetching appointments with filters:', { status, date, limit, offset });

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

    // Получаем записи с пагинацией
    const [appointments, totalCount] = await Promise.all([
      db.appointment.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              name: true,     // Используем поле name
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
          appointmentDate: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.appointment.count({ where: whereClause })
    ]);

    console.log(`Found ${appointments.length} appointments`);

    // Форматируем данные для фронтенда
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      date: appointment.appointmentDate.toISOString().split('T')[0],
      startTime: appointment.startTime,  // Уже строка
      endTime: appointment.endTime,      // Уже строка
      status: appointment.status,
      client: {
        id: appointment.client.id,
        name: appointment.client.name || 'Неизвестный клиент',
        // Для совместимости разбиваем name на firstName/lastName
        firstName: appointment.client.name?.split(' ')[0] || '',
        lastName: appointment.client.name?.split(' ').slice(1).join(' ') || '',
        phone: appointment.client.phone,
        email: appointment.client.email
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        duration: appointment.service.duration
      },
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching appointments list:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при получении списка записей',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST метод для создания записи (дублирует основной API)
export async function POST(request: NextRequest) {
  try {
    // Перенаправляем на основной API
    const body = await request.json();
    
    const response = await fetch(`${request.nextUrl.origin}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error in appointments/list POST:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании записи' },
      { status: 500 }
    );
  }
}

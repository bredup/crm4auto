import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'autoservice_crm'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const connection = await mysql.createConnection(dbConfig);

    const [results] = await connection.execute(
      `SELECT id, 
              CASE 
                WHEN name IS NOT NULL AND name != '' THEN name
                ELSE CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))
              END as name,
              firstName, lastName, phone, email 
       FROM clients 
       WHERE (name LIKE ? OR CONCAT(firstName, ' ', lastName) LIKE ? OR phone LIKE ?) 
       ORDER BY name ASC 
       LIMIT 10`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    await connection.end();

    return NextResponse.json(results);
  } catch (error) {
    console.error('Ошибка поиска клиентов:', error);
    return NextResponse.json(
      { error: 'Ошибка поиска клиентов' },
      { status: 500 }
    );
  }
}

// app/api/clients/[id]/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'autoservice_crm'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Неверный ID клиента' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    const [vehicles] = await connection.execute(
      'SELECT * FROM vehicles WHERE clientId = ? ORDER BY make, model',
      [clientId]
    );

    await connection.end();

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Ошибка загрузки автомобилей клиента:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки автомобилей' },
      { status: 500 }
    );
  }
}

// app/api/appointments/available-slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'autoservice_crm'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '60');

    if (!date) {
      return NextResponse.json(
        { error: 'Дата обязательна' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    // Получаем занятые слоты на указанную дату
    const [bookedSlots] = await connection.execute(
      `SELECT startTime as scheduledTime, 
              CASE 
                WHEN s.duration IS NOT NULL THEN s.duration 
                ELSE 60 
              END as duration
       FROM appointments a
       LEFT JOIN services s ON a.serviceId = s.id
       WHERE date = ? AND status != 'CANCELLED'`,
      [date]
    );

    await connection.end();

    // Генерируем все возможные слоты (с 9:00 до 18:00 с интервалом 30 минут)
    const allSlots: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(time);
      }
    }

    // Фильтруем доступные слоты
    const availableSlots = allSlots.filter(slot => {
      const slotTime = new Date(`2000-01-01 ${slot}`);
      const slotEnd = new Date(slotTime.getTime() + duration * 60000);

      // Проверяем, не пересекается ли этот слот с уже забронированными
      return !(bookedSlots as any[]).some(booked => {
        const bookedStart = new Date(`2000-01-01 ${booked.scheduledTime}`);
        const bookedEnd = new Date(bookedStart.getTime() + booked.duration * 60000);

        return (slotTime < bookedEnd && slotEnd > bookedStart);
      });
    });

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error('Ошибка загрузки свободных слотов:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки свободных слотов' },
      { status: 500 }
    );
  }
}

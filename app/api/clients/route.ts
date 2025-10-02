import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - получить всех клиентов или с фильтром
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let whereClause = {};
    
    if (search && search.length >= 2) {
      whereClause = {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } }
        ]
      };
    }

    const clients = await db.client.findMany({
      where: whereClause,
      include: {
        vehicles: true,
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения клиентов' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, address, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Имя и телефон обязательны' },
        { status: 400 }
      );
    }

    console.log('🆕 Создание клиента:', { name, phone, email });

    // Проверяем существование клиента с таким телефоном
    const existingClient = await db.client.findFirst({
      where: { phone }
    });

    if (existingClient) {
      console.log('ℹ️ Клиент с таким телефоном уже существует, возвращаем его');
      // ВАЖНО: Возвращаем существующего клиента вместо ошибки
      return NextResponse.json({ 
        success: true, 
        client: {
          id: existingClient.id,
          name: existingClient.name,
          phone: existingClient.phone,
          email: existingClient.email
        },
        message: 'Клиент с таким телефоном уже существует'
      }, { status: 200 });
    }

    // Создаём нового клиента
    const client = await db.client.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null
      }
    });

    console.log('✅ Клиент создан:', client.id);

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Ошибка создания клиента:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка создания клиента' },
      { status: 500 }
    );
  }
}

// PATCH - обновить клиента
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, email } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID клиента обязателен' },
        { status: 400 }
      );
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email })
      }
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления клиента' },
      { status: 500 }
    );
  }
}

// DELETE - удалить клиента
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID клиента обязателен' },
        { status: 400 }
      );
    }

    await db.client.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления клиента' },
      { status: 500 }
    );
  }
}

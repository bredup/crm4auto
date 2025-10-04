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
    const { name, firstName, lastName, phone, email, address, notes } = body;

    // Формируем имя из firstName + lastName или используем name
    const clientName = name || `${firstName || ''} ${lastName || ''}`.trim();

    if (!clientName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Имя и телефон обязательны' },
        { status: 400 }
      );
    }

    // Очищаем телефон от форматирования для проверки
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    console.log('🆕 Создание клиента:', { name: clientName, phone, email });

    // Проверяем существование клиента с таким телефоном (по очищенным цифрам)
    const allClients = await db.client.findMany();
    const existingClient = allClients.find(c => c.phone.replace(/\D/g, '') === cleanPhone);

    if (existingClient) {
      console.log('ℹ️ Клиент с таким телефоном уже существует, возвращаем его');
      return NextResponse.json({ 
        success: true, 
        client: {
          id: existingClient.id,
          name: existingClient.name,
          firstName: existingClient.name.split(' ')[0] || '',
          lastName: existingClient.name.split(' ').slice(1).join(' ') || '',
          phone: existingClient.phone,
          email: existingClient.email
        },
        message: 'Клиент с таким телефоном уже существует'
      }, { status: 200 });
    }

    // Создаём нового клиента
    const client = await db.client.create({
      data: {
        name: clientName,
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
        firstName: firstName || client.name.split(' ')[0] || '',
        lastName: lastName || client.name.split(' ').slice(1).join(' ') || '',
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

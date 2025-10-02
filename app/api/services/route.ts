import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - получить все услуги
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    console.log('🛠️ Загрузка услуг...');

    let whereClause = {};
    if (category) {
      whereClause = { category };
    }

    const services = await db.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    console.log(`✅ Найдено услуг: ${services.length}`);

    // ВАЖНО: Возвращаем с success: true для совместимости с модалом
    return NextResponse.json({ 
      success: true, 
      services 
    });
  } catch (error) {
    console.error('❌ Ошибка получения услуг:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения услуг' },
      { status: 500 }
    );
  }
}

// POST - создать услугу
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, duration, price, category, description } = body;

    if (!name || !duration || !price) {
      return NextResponse.json(
        { success: false, error: 'Обязательные поля: name, duration, price' },
        { status: 400 }
      );
    }

    console.log('🆕 Создание услуги:', { name, duration, price });

    const service = await db.service.create({
      data: {
        name,
        duration,
        price,
        category: category || 'Прочее',
        description: description || null
      }
    });

    console.log('✅ Услуга создана:', service.id);

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    console.error('❌ Ошибка создания услуги:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка создания услуги' },
      { status: 500 }
    );
  }
}

// PATCH - обновить услугу
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, duration, price, category, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID услуги обязателен' },
        { status: 400 }
      );
    }

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(duration && { duration }),
        ...(price && { price }),
        ...(category && { category }),
        ...(description !== undefined && { description })
      }
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('❌ Ошибка обновления услуги:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления услуги' },
      { status: 500 }
    );
  }
}

// DELETE - удалить услугу
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID услуги обязателен' },
        { status: 400 }
      );
    }

    await db.service.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка удаления услуги:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления услуги' },
      { status: 500 }
    );
  }
}

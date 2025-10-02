import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - получить автомобили клиента
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId обязателен' }, 
        { status: 400 }
      );
    }

    console.log('🚗 Загрузка автомобилей для клиента:', clientId);

    const vehicles = await db.vehicle.findMany({
      where: { clientId },
      orderBy: { brand: 'asc' }
    });

    console.log(`✅ Найдено автомобилей: ${vehicles.length}`);

    return NextResponse.json({ success: true, vehicles });
  } catch (error) {
    console.error('❌ Ошибка получения автомобилей:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения автомобилей' }, 
      { status: 500 }
    );
  }
}

// DELETE - удалить автомобиль
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID автомобиля обязателен' },
        { status: 400 }
      );
    }

    console.log('🗑️ Удаление автомобиля:', id);

    await db.vehicle.delete({
      where: { id }
    });

    console.log('✅ Автомобиль удалён');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка удаления автомобиля:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления автомобиля' },
      { status: 500 }
    );
  }
}

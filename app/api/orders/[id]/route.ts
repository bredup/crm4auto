import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - получить заказ по ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
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
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // Добавляем totalCost = estimatedCost для совместимости
    const orderWithTotal = {
      ...order,
      totalCost: order.estimatedCost
    };

    return NextResponse.json({ success: true, order: orderWithTotal });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения заказа' },
      { status: 500 }
    );
  }
}

// PATCH - обновить заказ
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, priority, totalCost, notes } = body;

    const order = await db.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(totalCost !== undefined && { totalCost: parseFloat(totalCost.toString()) }),
        ...(notes !== undefined && { notes })
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
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
      }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления заказа' },
      { status: 500 }
    );
  }
}

// DELETE - удалить заказ
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    await db.order.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления заказа' },
      { status: 500 }
    );
  }
}

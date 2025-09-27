import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем последние 10 заказов с информацией о клиенте и автомобиле
    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
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
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Форматируем данные для фронтенда
    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      clientName: order.client.name,
      clientPhone: order.client.phone,
      vehicleInfo: order.vehicle 
        ? `${order.vehicle.brand} ${order.vehicle.model} ${order.vehicle.year}`
        : 'Автомобиль не указан',
      plateNumber: order.vehicle?.licensePlate || null,
      serviceType: order.description, // Используем description как serviceType
      description: order.notes,
      status: order.status.toLowerCase(),
      priority: order.priority?.toLowerCase() || 'normal',
      totalCost: Number(order.finalCost || order.estimatedCost || 0),
      createdAt: order.createdAt.toISOString(),
      startDate: order.estimatedDate?.toISOString() || null,
      completedAt: order.completedDate?.toISOString() || null,
      assignedTo: order.assignedTo?.name || 'Не назначен'
    }))

    return NextResponse.json(formattedOrders)

  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

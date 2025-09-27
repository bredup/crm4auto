import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем последние 10 заказов с информацией о клиенте, автомобиле и услуге
    const recentOrders = await prisma.order.findMany({
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
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Форматируем данные для frontend
    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      clientName: order.client.name,
      clientPhone: order.client.phone,
      vehicleInfo: order.vehicle ? 
        `${order.vehicle.brand} ${order.vehicle.model} (${order.vehicle.year})` : 
        'Автомобиль не указан',
      plateNumber: order.vehicle?.licensePlate || null,
      serviceType: order.description || 'Услуга не указана',
      description: order.notes || null,
      status: order.status,
      priority: order.priority || 'medium',
      totalCost: 0, // Временно пока не определим правильное поле
      createdAt: order.createdAt.toISOString(),
      startDate: order.estimatedDate?.toISOString() || null,
      completedDate: order.completedDate?.toISOString() || null,
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

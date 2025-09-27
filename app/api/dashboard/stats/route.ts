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

    // Параллельно получаем всю статистику
    const [
      totalClients,
      activeOrders,
      totalVehicles,
      completedOrdersThisMonth
    ] = await Promise.all([
      // Общее количество клиентов
      db.client.count(),
      
      // Активные заказы (не завершенные)
      db.order.count({
        where: {
          status: {
            in: ['RECEIVED', 'IN_PROGRESS', 'READY']
          }
        }
      }),
      
      // Общее количество автомобилей
      db.vehicle.count(),
      
      // Завершенные заказы за текущий месяц для расчета дохода
      db.order.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        },
        select: {
          finalCost: true,
          estimatedCost: true
        }
      })
    ])

    // Подсчитываем месячный доход
    const monthlyRevenue = completedOrdersThisMonth.reduce(
      (sum, order) => sum + Number(order.finalCost || order.estimatedCost || 0), 
      0
    )

    // Получаем статистику за предыдущий месяц для расчета изменений
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const [
      prevMonthClients,
      prevMonthOrders,
      prevMonthVehicles
    ] = await Promise.all([
      db.client.count({
        where: {
          createdAt: {
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      db.order.count({
        where: {
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
          },
          status: {
            in: ['RECEIVED', 'IN_PROGRESS', 'READY']
          }
        }
      }),
      
      db.vehicle.count({
        where: {
          createdAt: {
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    // Вычисляем процентные изменения
    const clientsChange = prevMonthClients > 0 
      ? Math.round(((totalClients - prevMonthClients) / prevMonthClients) * 100)
      : totalClients > 0 ? 100 : 0
      
    const ordersChange = prevMonthOrders > 0
      ? Math.round(((activeOrders - prevMonthOrders) / prevMonthOrders) * 100) 
      : activeOrders > 0 ? 100 : 0
      
    const vehiclesChange = prevMonthVehicles > 0
      ? Math.round(((totalVehicles - prevMonthVehicles) / prevMonthVehicles) * 100)
      : totalVehicles > 0 ? 100 : 0

    return NextResponse.json({
      totalClients,
      activeOrders,
      totalVehicles,
      monthlyRevenue,
      changes: {
        clients: clientsChange,
        orders: ordersChange,
        vehicles: vehiclesChange
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

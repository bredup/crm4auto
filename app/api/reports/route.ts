import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // дней
    const reportType = searchParams.get('type') || 'overview'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    let reportData: any = {}

    if (reportType === 'overview') {
      // Общая статистика
      const [
        totalClients,
        totalVehicles,
        totalOrders,
        completedOrders,
        activeOrders,
        totalServices,
        totalInventory,
        lowStockItems,
        recentOrders,
        ordersByStatus
      ] = await Promise.all([
        db.client.count(),
        db.vehicle.count(),
        db.order.count(),
        db.order.count({ where: { status: 'COMPLETED' } }),
        db.order.count({ 
          where: { status: { in: ['RECEIVED', 'IN_PROGRESS', 'READY'] } }
        }),
        db.service.count({ where: { active: true } }),
        db.inventoryItem.count({ where: { active: true } }),
        db.inventoryItem.count({
          where: {
            active: true,
            quantity: { lte: db.inventoryItem.fields.minQuantity }
          }
        }),
        db.order.findMany({
          where: { createdAt: { gte: startDate } },
          include: {
            client: { select: { name: true } },
            vehicle: { select: { brand: true, model: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        db.order.groupBy({
          by: ['status'],
          _count: { status: true },
          where: { createdAt: { gte: startDate } }
        })
      ])

      // Заказы по дням
      const dailyOrders = await db.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, estimatedCost: true, finalCost: true }
      })

      const dailyOrdersGrouped = dailyOrders.reduce((acc: any, order) => {
        const date = order.createdAt.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { count: 0, revenue: 0 }
        }
        acc[date].count++
        acc[date].revenue += Number(order.finalCost || order.estimatedCost || 0)
        return acc
      }, {})

      const dailyStats = Object.entries(dailyOrdersGrouped).map(([date, data]: [string, any]) => ({
        date,
        orders: data.count,
        revenue: data.revenue
      }))

      reportData = {
        overview: {
          totalClients,
          totalVehicles,
          totalOrders,
          completedOrders,
          activeOrders,
          totalServices,
          totalInventory,
          lowStockItems,
          completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
        },
        recentOrders,
        ordersByStatus,
        dailyStats: dailyStats.sort((a, b) => a.date.localeCompare(b.date))
      }
    }

    if (reportType === 'financial') {
      // Финансовые отчеты
      const completedOrdersWithRevenue = await db.order.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate },
          finalCost: { not: null }
        },
        select: {
          finalCost: true,
          estimatedCost: true,
          createdAt: true,
          client: { select: { name: true } }
        }
      })

      const totalRevenue = completedOrdersWithRevenue.reduce(
        (sum, order) => sum + Number(order.finalCost || 0), 0
      )

      const avgOrderValue = completedOrdersWithRevenue.length > 0 
        ? totalRevenue / completedOrdersWithRevenue.length 
        : 0

      // Доходы по месяцам
      const monthlyRevenue = completedOrdersWithRevenue.reduce((acc: any, order) => {
        const month = order.createdAt.toISOString().substring(0, 7)
        acc[month] = (acc[month] || 0) + Number(order.finalCost || 0)
        return acc
      }, {})

      reportData = {
        financial: {
          totalRevenue,
          avgOrderValue,
          completedOrdersCount: completedOrdersWithRevenue.length,
          monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
            month,
            revenue
          }))
        },
        topClients: completedOrdersWithRevenue
          .reduce((acc: any, order) => {
            const clientName = order.client.name
            if (!acc[clientName]) {
              acc[clientName] = { name: clientName, revenue: 0, orders: 0 }
            }
            acc[clientName].revenue += Number(order.finalCost || 0)
            acc[clientName].orders++
            return acc
          }, {})
      }
    }

    if (reportType === 'services') {
      // Популярные услуги (пока заглушка, так как нет связи с заказами)
      const allServices = await db.service.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
      })

      reportData = {
        services: {
          totalActive: allServices.length,
          servicesByCategory: allServices.reduce((acc: any, service) => {
            const cat = service.category || 'Без категории'
            acc[cat] = (acc[cat] || 0) + 1
            return acc
          }, {}),
          avgPrice: allServices.length > 0 
            ? allServices.reduce((sum, s) => sum + Number(s.price), 0) / allServices.length
            : 0
        }
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

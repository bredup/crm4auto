'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { 
  TrendingUp, Users, Car, FileText, DollarSign, 
  Calendar, Package, AlertTriangle, Award, Target
} from 'lucide-react'

interface ReportData {
  overview?: {
    totalClients: number
    totalVehicles: number
    totalOrders: number
    completedOrders: number
    activeOrders: number
    totalServices: number
    totalInventory: number
    lowStockItems: number
    completionRate: number
  }
  recentOrders?: any[]
  ordersByStatus?: any[]
  dailyStats?: any[]
  financial?: {
    totalRevenue: number
    avgOrderValue: number
    completedOrdersCount: number
    monthlyRevenue: any[]
  }
  topClients?: any
  services?: {
    totalActive: number
    servicesByCategory: any
    avgPrice: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const statusLabels: Record<string, string> = {
  RECEIVED: 'Принят',
  IN_PROGRESS: 'В работе',
  WAITING_PARTS: 'Ожидает запчасти',
  READY: 'Готов',
  COMPLETED: 'Выдан',
  CANCELLED: 'Отменен'
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({})
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [selectedReport, setSelectedReport] = useState('overview')

  const fetchReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports?period=${selectedPeriod}&type=${selectedReport}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [selectedPeriod, selectedReport])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Отчеты и аналитика</h1>
          <p className="text-gray-600">Анализ работы автосервиса</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
          >
            <option value="overview">Общий обзор</option>
            <option value="financial">Финансы</option>
            <option value="services">Услуги</option>
          </select>
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7">7 дней</option>
            <option value="30">30 дней</option>
            <option value="90">3 месяца</option>
            <option value="365">1 год</option>
          </select>
        </div>
      </div>

      {selectedReport === 'overview' && reportData.overview && (
        <>
          {/* Основная статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Всего клиентов</p>
                    <p className="text-2xl font-bold">{reportData.overview.totalClients}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Автомобилей</p>
                    <p className="text-2xl font-bold">{reportData.overview.totalVehicles}</p>
                  </div>
                  <Car className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Активных заказов</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {reportData.overview.activeOrders}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Процент завершения</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.overview.completionRate}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Графики */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Заказы по дням */}
            {reportData.dailyStats && reportData.dailyStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Заказы по дням</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                        formatter={(value) => [value, 'Заказов']}
                      />
                      <Line 
                        dataKey="orders" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Заказы по статусам */}
            {reportData.ordersByStatus && reportData.ordersByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Статусы заказов</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.ordersByStatus.map((item, index) => ({
                          name: statusLabels[item.status] || item.status,
                          value: item._count.status,
                          color: COLORS[index % COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {reportData.ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Последние заказы */}
          {reportData.recentOrders && reportData.recentOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Последние заказы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {order.client?.name} • {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : 'Без автомобиля'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {statusLabels[order.status]}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedReport === 'financial' && reportData.financial && (
        <>
          {/* Финансовая статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Общая выручка</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.financial.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Средний чек</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.financial.avgOrderValue)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Завершено заказов</p>
                    <p className="text-2xl font-bold">
                      {reportData.financial.completedOrdersCount}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* График доходов по месяцам */}
          {reportData.financial.monthlyRevenue && reportData.financial.monthlyRevenue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Доходы по месяцам</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.financial.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-')
                        return `${month}.${year}`
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Доходы']}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedReport === 'services' && reportData.services && (
        <Card>
          <CardHeader>
            <CardTitle>Статистика по услугам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Активных услуг</p>
                <p className="text-2xl font-bold">{reportData.services.totalActive}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Средняя цена</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportData.services.avgPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Категорий</p>
                <p className="text-2xl font-bold">
                  {Object.keys(reportData.services.servicesByCategory).length}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Услуги по категориям</h4>
              <div className="space-y-2">
                {Object.entries(reportData.services.servicesByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span>{category}</span>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { 
  Users, 
  Car, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  Calendar,
  Eye,
  Plus
} from 'lucide-react'
import { AppointmentModal } from '@/components/modals/appointment-modal'
import { OrderModal } from '@/components/modals/order-modal'
import { AppointmentDetailModal } from '@/components/modals/appointment-detail-modal'
import { EditAppointmentModal } from '@/components/modals/edit-appointment-modal'
import { OrderDetailModal } from '@/components/modals/order-detail-modal'

interface DashboardStats {
  totalClients: number
  activeOrders: number
  totalVehicles: number
  monthlyRevenue: number
  changes: {
    clients: number
    orders: number
    vehicles: number
  }
}

interface AppointmentsByDate {
  [date: string]: Appointment[]
}

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes?: string
  client: {
    id: string
    name: string
    phone: string
    email?: string
  }
  vehicle?: {
    id: string
    brand: string
    model: string
    year: number
    licensePlate?: string
  }
  service: {
    id: string
    name: string
    price: number
    duration: number
    category?: string
  }
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [appointments, setAppointments] = useState<AppointmentsByDate>({})
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    loadAppointments(currentDate)
  }, [currentDate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [statsResponse, appointmentsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/appointments')
      ])
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        if (appointmentsData.success && appointmentsData.appointments) {
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          
          const todayAppts = appointmentsData.appointments.filter((apt: Appointment) => 
            apt.date === todayStr
          ).sort((a: Appointment, b: Appointment) => a.startTime.localeCompare(b.startTime))
          
          setTodayAppointments(todayAppts)
          setFilteredAppointments(todayAppts)
        }
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async (date: Date) => {
    try {
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      const response = await fetch(`/api/appointments?month=${monthStr}`)
      
      if (response.ok) {
        const appointmentsData = await response.json()
        setAppointments(appointmentsData)
      }
    } catch (error) {
      console.error('Ошибка загрузки записей:', error)
    }
  }

  const handleAppointmentCreated = () => {
    loadAppointments(currentDate)
    loadDashboardData()
  }

  const handleOrderCreated = () => {
    loadDashboardData()
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailModalOpen(true)
  }

  const handleCreateOrderFromAppointment = async (appointmentId: string): Promise<string> => {
    try {
      const appointment = selectedAppointment
      if (!appointment) throw new Error('Запись не найдена')

      const orderData = {
        clientId: appointment.client.id,
        vehicleId: appointment.vehicle?.id || null,
        description: `Заказ-наряд из записи: ${appointment.service.name}`,
        priority: 'NORMAL',
        estimatedCost: appointment.service.price,
        estimatedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: `Создано из записи #${appointmentId}. Услуга: ${appointment.service.name}`
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const data = await response.json()
        // API возвращает просто объект заказа, не { order: ... }
        const orderId = data.id
        
        loadDashboardData()
        setIsDetailModalOpen(false)
        
        setCreatedOrderId(orderId)
        setIsOrderDetailModalOpen(true)
        
        return orderId
      } else {
        throw new Error('Ошибка создания заказа')
      }
    } catch (error) {
      console.error('Ошибка создания заказа:', error)
      throw error
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    loadDashboardData()
    loadAppointments(currentDate)
    setIsEditModalOpen(false)
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadDashboardData()
        loadAppointments(currentDate)
        setIsDetailModalOpen(false)
      } else {
        throw new Error('Ошибка удаления записи')
      }
    } catch (error) {
      console.error('Ошибка удаления:', error)
      throw error
    }
  }

  const getStatsCards = () => {
    if (!stats) return []
    
    return [
      {
        title: 'Всего клиентов',
        value: stats.totalClients,
        change: stats.changes.clients,
        icon: Users,
        color: 'blue'
      },
      {
        title: 'Активные заказы',
        value: stats.activeOrders,
        change: stats.changes.orders,
        icon: FileText,
        color: 'green'
      },
      {
        title: 'Автомобили',
        value: stats.totalVehicles,
        change: stats.changes.vehicles,
        icon: Car,
        color: 'yellow'
      },
      {
        title: 'Доход за месяц',
        value: `${stats.monthlyRevenue.toLocaleString()} ₽`,
        change: 12.5,
        icon: TrendingUp,
        color: 'purple'
      }
    ]
  }

  const getIconBgColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      yellow: 'bg-yellow-100',
      purple: 'bg-purple-100'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100'
  }

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600'
    }
    return colors[color as keyof typeof colors] || 'text-gray-600'
  }

  const getStatusColor = (status: string) => {
    const statusColors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const generateCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDateObj = new Date()
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const dayAppointments = appointments[dateStr] || []
      const isCurrentMonth = date.getMonth() === currentDate.getMonth()
      const isToday = date.toDateString() === currentDateObj.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()
      
      days.push({
        date,
        dateStr,
        day: date.getDate(),
        appointments: dayAppointments,
        isCurrentMonth,
        isToday,
        isSelected
      })
    }
    
    return days
  }

  const handleDayClick = (date: Date, dayAppointments: Appointment[]) => {
    setSelectedDate(date)
    setFilteredAppointments(dayAppointments)
  }

  const statsCards = getStatsCards()
  const calendarDays = generateCalendar()
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Главная панель</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAppointmentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новая запись
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новый заказ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  {typeof card.change === 'number' && (
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      card.change >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {card.change >= 0 ? '+' : ''}{card.change}%
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-2xl ${getIconBgColor(card.color)}`}>
                  <Icon className={`w-6 h-6 ${getIconColor(card.color)}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Календарь записей</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-medium text-gray-900 min-w-[150px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[80px] p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                  ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                  ${day.isSelected ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={() => handleDayClick(day.date, day.appointments)}
              >
                <div className={`text-sm font-medium mb-1 ${day.isToday ? 'text-blue-600' : ''}`}>
                  {day.day}
                </div>
                {day.appointments.length > 0 && (
                  <div className="space-y-1">
                    {day.appointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                      >
                        {appointment.startTime} {appointment.client.name}
                      </div>
                    ))}
                    {day.appointments.length > 2 && (
                      <div className="text-xs text-gray-600">
                        +{day.appointments.length - 2} еще
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDate 
                ? `Записи на ${format(selectedDate, 'd MMM', { locale: ru })}`
                : 'Записи на сегодня'
              }
            </h2>
            <div className="flex items-center gap-2">
              {selectedDate && (
                <button
                  onClick={() => {
                    setSelectedDate(null)
                    setFilteredAppointments(todayAppointments)
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Сбросить
                </button>
              )}
              <Link 
                href="/dashboard/appointments" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Все
              </Link>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  onClick={() => handleAppointmentClick(appointment)}
                  className="p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{appointment.client.name}</p>
                      <p className="text-xs text-gray-500">{appointment.service.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(appointment.date), 'd MMM yyyy', { locale: ru })}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      {appointment.startTime}-{appointment.endTime}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">
                {selectedDate ? 'Нет записей на этот день' : 'Нет записей на сегодня'}
              </p>
            )}
          </div>
        </div>
      </div>

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={handleAppointmentCreated}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={handleOrderCreated}
      />

      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        appointment={selectedAppointment}
        onCreateOrder={handleCreateOrderFromAppointment}
        onDelete={handleDeleteAppointment}
        onEdit={handleEditAppointment}
      />

      <EditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        appointment={selectedAppointment}
      />

      <OrderDetailModal
        isOpen={isOrderDetailModalOpen}
        onClose={() => {
          setIsOrderDetailModalOpen(false)
          setCreatedOrderId(null)
        }}
        orderId={createdOrderId}
        onUpdate={loadDashboardData}
      />
    </div>
  )
}

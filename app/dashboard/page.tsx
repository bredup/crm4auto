'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns' // ДОБАВЛЕН ИМПОРТ
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
  Eye
} from 'lucide-react'
import { AppointmentModal } from '@/components/modals/appointment-modal'

// Интерфейсы для типизации данных
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

interface RecentOrder {
  id: string
  clientName: string
  clientPhone: string
  vehicleInfo: string
  plateNumber?: string
  serviceType: string
  description?: string
  status: string
  priority: string
  totalCost: number
  createdAt: string
  startDate?: string
  completedAt?: string
  assignedTo: string
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
    make: string
    model: string
    year: number
    plateNumber?: string
    fullInfo: string
  }
  service: {
    id: string
    name: string
    price: number
    duration: number
    category: string
  }
  assignedTo: string
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [appointments, setAppointments] = useState<AppointmentsByDate>({})
  const [loading, setLoading] = useState(true)
  
  // Состояния для модального окна
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Загрузка записей при изменении месяца
  useEffect(() => {
    loadAppointments(currentDate)
  }, [currentDate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Параллельная загрузка статистики и заказов
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/orders/recent')
      ])
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData)
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

  // Функция для обновления записей после создания новой
  const handleAppointmentCreated = () => {
    loadAppointments(currentDate)
    loadDashboardData() // Обновляем также статистику
  }

  // Статистические карточки
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

  // Получение цвета фона иконки
  const getIconBgColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      yellow: 'bg-yellow-100',
      purple: 'bg-purple-100'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100'
  }

  // Получение цвета иконки
  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600'
    }
    return colors[color as keyof typeof colors] || 'text-gray-600'
  }

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    const statusColors = {
      'new': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  // Получение цвета приоритета
  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    }
    return priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'
  }

  // Навигация по месяцам
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // Генерация календарной сетки
  const generateCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
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
      
      days.push({
        date,
        dateStr,
        day: date.getDate(),
        appointments: dayAppointments,
        isCurrentMonth,
        isToday
      })
    }
    
    return days
  }

  // Обработка клика по дню - открывает модальное окно с выбранной датой
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setIsAppointmentModalOpen(true)
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
      {/* Заголовок без кнопки */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Главная панель</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Статистические карточки */}
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
        {/* Календарь */}
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

          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Календарная сетка */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[80px] p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                  ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                `}
                onClick={() => handleDayClick(day.date)}
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

        {/* Последние заказы */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Последние заказы</h2>
            <Link 
              href="/dashboard/orders" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Все
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{order.clientName}</p>
                      <p className="text-sm text-gray-600">{order.vehicleInfo}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{order.serviceType}</p>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {order.totalCost.toLocaleString()} ₽
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Нет последних заказов</p>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно записи */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false)
          setSelectedDate(null)
          setSelectedTime(null)
        }}
        onSuccess={() => {
          setIsAppointmentModalOpen(false)
          setSelectedDate(null)
          setSelectedTime(null)
          handleAppointmentCreated()
        }}
        selectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined} // ИСПРАВЛЕНО
      />
    </div>
  )
}

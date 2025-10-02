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
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Plus,
  Eye,
  Wrench,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Activity
} from 'lucide-react'
import { AppointmentModal } from '@/components/modals/appointment-modal'
import { OrderModal } from '@/components/modals/order-modal'

// Интерфейсы
interface DashboardStats {
  totalClients: number
  activeOrders: number
  totalVehicles: number
  monthlyRevenue: number
  todayAppointments: number
  completionRate: number
  averageCheck: number
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
    firstName?: string
    lastName?: string
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
  }
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [displayedAppointments, setDisplayedAppointments] = useState<Appointment[]>([])
  const [appointments, setAppointments] = useState<AppointmentsByDate>({})
  const [loading, setLoading] = useState(true)
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  console.log('isOrderModalOpen:', isOrderModalOpen) // Для отладки

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    loadAppointments(currentDate)
  }, [currentDate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [statsResponse, recentAppointmentsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/appointments')
      ])
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          ...statsData,
          todayAppointments: 0,
          completionRate: 0,
          averageCheck: 0
        })
      }
      
      if (recentAppointmentsResponse.ok) {
        const data = await recentAppointmentsResponse.json()
        if (data.success && Array.isArray(data.appointments)) {
          // Показываем последние записи по умолчанию
          setDisplayedAppointments(data.appointments.slice(0, 10))
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
        const data = await response.json()
        if (data.success && data.appointments) {
          setAppointments(data.appointments)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки записей:', error)
    }
  }

  const handleAppointmentCreated = () => {
    loadAppointments(currentDate)
    loadDashboardData()
  }

  const getStatsCards = () => {
    if (!stats) return []
    
    return [
      {
        title: 'Записей сегодня',
        value: stats.todayAppointments || 0,
        change: '+3 чем вчера',
        icon: CalendarIcon,
        color: 'blue',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600'
      },
      {
        title: 'Активные заказы',
        value: stats.activeOrders,
        change: `${stats.changes.orders >= 0 ? '+' : ''}${stats.changes.orders}%`,
        icon: FileText,
        color: 'green',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600'
      },
      {
        title: 'Средний чек',
        value: `${(stats.averageCheck || 0).toLocaleString()} ₽`,
        change: '+12%',
        icon: DollarSign,
        color: 'purple',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600'
      },
      {
        title: 'Выполнение',
        value: `${stats.completionRate || 0}%`,
        change: 'За неделю',
        icon: Activity,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600'
      }
    ]
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      SCHEDULED: { label: 'Запланирован', color: 'bg-blue-100 text-blue-800' },
      CONFIRMED: { label: 'Подтверждён', color: 'bg-green-100 text-green-800' },
      IN_PROGRESS: { label: 'В работе', color: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Завершён', color: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Отменён', color: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
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
      
      const dateStr = format(date, 'yyyy-MM-dd')
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

  const handleDayClick = (day: any) => {
    setSelectedDate(day.date)
    
    // Показываем записи выбранного дня
    const dayAppointments = appointments[day.dateStr] || []
    setDisplayedAppointments(dayAppointments)
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
      {/* Заголовок с быстрыми действиями */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Главная панель</h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
          </p>
        </div>
        
        {/* Быстрые действия */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              console.log('Новая запись clicked')
              setIsAppointmentModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Новая запись</span>
          </button>
          <button
            onClick={() => {
              console.log('Новый заказ clicked')
              setIsOrderModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Wrench className="w-5 h-5" />
            <span className="font-medium">Новый заказ</span>
          </button>
        </div>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div 
              key={index} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-xl ${card.bgColor}`}>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.change}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Календарь - занимает 3 колонки */}
        <div className="xl:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Календарь записей
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-medium text-gray-900 min-w-[160px] text-center">
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
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Календарная сетка */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[90px] p-2 border rounded-xl cursor-pointer transition-all
                  ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50/50 border-gray-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}
                  ${day.isToday ? 'bg-blue-50 border-blue-300 shadow-sm' : ''}
                  ${selectedDate && day.dateStr === format(selectedDate, 'yyyy-MM-dd') ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className={`text-sm font-semibold mb-1 ${day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day.day}
                </div>
                {day.appointments.length > 0 && (
                  <div className="space-y-1">
                    {day.appointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="text-[10px] leading-tight p-1.5 bg-blue-100 text-blue-800 rounded-lg truncate font-medium"
                        title={`${appointment.startTime} - ${appointment.client.name}`}
                      >
                        {appointment.startTime.substring(0, 5)} {appointment.client.name.split(' ')[0]}
                      </div>
                    ))}
                    {day.appointments.length > 2 && (
                      <div className="text-[10px] text-gray-600 font-medium pl-1">
                        +{day.appointments.length - 2} ещё
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Записи выбранного дня или последние */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              {selectedDate 
                ? `Записи на ${format(selectedDate, 'd MMMM', { locale: ru })}`
                : 'Последние записи'
              }
            </h2>
            <div className="flex items-center gap-2">
              {selectedDate && (
                <button
                  onClick={() => {
                    setSelectedDate(null)
                    loadDashboardData()
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Сбросить
                </button>
              )}
              <Link 
                href="/dashboard/appointments" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Все записи
              </Link>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {displayedAppointments.length > 0 ? (
              displayedAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all bg-gradient-to-r from-white to-gray-50"
                >
                  {/* Время, дата и статус */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold text-sm">
                        {appointment.startTime} - {appointment.endTime}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {format(new Date(appointment.date), 'd MMMM yyyy', { locale: ru })}
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                  
                  {/* Клиент */}
                  <div className="mb-2">
                    <p className="font-semibold text-gray-900 text-base">{appointment.client.name}</p>
                    <p className="text-sm text-gray-600">{appointment.client.phone}</p>
                  </div>
                  
                  {/* Автомобиль */}
                  {appointment.vehicle && (
                    <div className="mb-2 flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 font-medium">
                        {appointment.vehicle.brand} {appointment.vehicle.model} ({appointment.vehicle.year})
                      </span>
                      {appointment.vehicle.licensePlate && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-semibold">
                          {appointment.vehicle.licensePlate}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Услуга */}
                  <div className="flex items-start justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appointment.service.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{appointment.service.price.toLocaleString()} ₽</p>
                      <p className="text-xs text-gray-500">{appointment.service.duration} мин</p>
                    </div>
                  </div>

                  {/* Заметки */}
                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">
                  {selectedDate ? 'Нет записей на выбранный день' : 'Нет записей'}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedDate ? 'Выберите другой день в календаре' : 'Создайте новую запись, нажав кнопку выше'}
                </p>
              </div>
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
        }}
        onSuccess={() => {
          setIsAppointmentModalOpen(false)
          setSelectedDate(null)
          handleAppointmentCreated()
        }}
        selectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

      {/* Модальное окно заказ-наряда */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => {
          setIsOrderModalOpen(false)
          loadDashboardData()
        }}
      />
    </div>
  )
}

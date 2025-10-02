'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppointmentModal } from '@/components/modals/appointment-modal';
import { OrderModal } from '@/components/modals/order-modal';

interface DashboardStats {
  appointmentsToday: number;
  activeOrders: number;
  averageCheck: number;
  completionRate: number;
}

interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: string;
  client: {
    id: string;
    name: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Модалы
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      const filtered = appointments.filter(apt => 
        isSameDay(new Date(apt.appointmentDate), selectedDate)
      );
      setFilteredAppointments(filtered);
    } else {
      // Показываем последние 10 записей
      setFilteredAppointments(appointments.slice(0, 10));
    }
  }, [selectedDate, appointments]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, appointmentsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/appointments'), // Без фильтра - все записи
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        // API возвращает {success: true, appointments: [...]}
        if (appointmentsData.success) {
          const formattedAppointments = appointmentsData.appointments.map((apt: any) => ({
            ...apt,
            appointmentDate: new Date(apt.date), // Конвертируем date в appointmentDate
          }));
          setAppointments(formattedAppointments);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointmentDate), date)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date('1900-01-01')) ? null : date);
  };

  const handleResetFilter = () => {
    setSelectedDate(null);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const days = getDaysInMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header с кнопками */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Обзор и быстрые действия</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAppointmentModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Новая запись
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg font-semibold"
          >
            <FileText className="w-5 h-5 mr-2" />
            Новый заказ
          </button>
        </div>
      </div>

      {/* Метрики */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-1">Записи сегодня</div>
            <div className="text-3xl font-bold text-blue-600">{stats.appointmentsToday || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-1">Активные заказы</div>
            <div className="text-3xl font-bold text-green-600">{stats.activeOrders || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-1">Средний чек</div>
            <div className="text-3xl font-bold text-purple-600">{(stats.averageCheck || 0).toLocaleString()} ₽</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-1">Выполнение</div>
            <div className="text-3xl font-bold text-orange-600">{stats.completionRate || 0}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Календарь - КОМПАКТНЫЙ */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Календарь
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Календарная сетка - КОМПАКТНАЯ */}
          <div className="grid grid-cols-7 gap-1">
            {/* Пустые ячейки до первого дня месяца */}
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Дни месяца */}
            {days.map(day => {
              const dayAppointments = getAppointmentsForDate(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square p-1 rounded-lg border transition-all text-xs
                    ${isSelected ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-200 hover:border-blue-400'}
                    ${isCurrentDay ? 'bg-blue-100 font-bold' : ''}
                    ${dayAppointments.length > 0 ? 'bg-green-50' : ''}
                  `}
                >
                  <div>{format(day, 'd')}</div>
                  {dayAppointments.length > 0 && (
                    <div className="text-[10px] text-blue-600 font-semibold">
                      {dayAppointments.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Список записей */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedDate ? `${format(selectedDate, 'd MMMM', { locale: ru })}` : 'Последние записи'}
            </h2>
            {selectedDate && (
              <button
                onClick={handleResetFilter}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Нет записей
              </div>
            ) : (
              filteredAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-gray-900 text-sm">{apt.client.name}</div>
                    <div className="text-xs text-gray-600">{apt.startTime}</div>
                  </div>
                  <div className="text-xs text-gray-600">{apt.service.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{apt.client.phone}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Модалы */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={() => {
          setIsAppointmentModalOpen(false);
          loadData();
        }}
        selectedDate={selectedDate || undefined}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => {
          setIsOrderModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}

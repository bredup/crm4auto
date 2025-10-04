'use client'

import { useState } from 'react'
import { X, User, Phone, Mail, Car, Clock, Calendar, Wrench, DollarSign, FileText, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

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

interface AppointmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onCreateOrder?: (appointmentId: string) => Promise<string> // Теперь возвращает ID заказа
  onDelete?: (appointmentId: string) => void
  onEdit?: (appointment: Appointment) => void
}

export function AppointmentDetailModal({ 
  isOpen, 
  onClose, 
  appointment,
  onCreateOrder,
  onDelete,
  onEdit
}: AppointmentDetailModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !appointment) return null

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'SCHEDULED': 'Запланирована',
      'CONFIRMED': 'Подтверждена',
      'IN_PROGRESS': 'В работе',
      'COMPLETED': 'Завершена',
      'CANCELLED': 'Отменена'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleCreateOrder = async () => {
    if (!onCreateOrder) return
    
    const confirmed = confirm('Создать заказ-наряд на основе этой записи?')
    if (!confirmed) return

    setLoading(true)
    try {
      await onCreateOrder(appointment.id)
      alert('Заказ-наряд успешно создан!')
      onClose()
    } catch (error) {
      console.error('Ошибка создания заказа:', error)
      alert('Ошибка при создании заказа-наряда')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    const confirmed = confirm('Вы уверены, что хотите удалить эту запись?')
    if (!confirmed) return

    setLoading(true)
    try {
      await onDelete(appointment.id)
      alert('Запись удалена')
      onClose()
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка при удалении записи')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Детали записи</h2>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(appointment.date), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Статус */}
          <div className="flex items-center justify-between">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </span>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-medium">
                {appointment.startTime} - {appointment.endTime}
              </span>
            </div>
          </div>

          {/* Клиент */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Клиент</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">{appointment.client.name}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{appointment.client.phone}</span>
              </div>
              {appointment.client.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">{appointment.client.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Автомобиль */}
          {appointment.vehicle && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Автомобиль</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {appointment.vehicle.brand} {appointment.vehicle.model} ({appointment.vehicle.year})
                </p>
                {appointment.vehicle.licensePlate && (
                  <p className="text-gray-600">
                    Гос. номер: <span className="font-medium">{appointment.vehicle.licensePlate}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Услуга */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Услуга</h3>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">{appointment.service.name}</p>
              {appointment.service.category && (
                <p className="text-xs text-gray-500">{appointment.service.category}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="text-sm">{appointment.service.duration} мин</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-xl font-bold text-gray-900">
                    {appointment.service.price.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Заметки */}
          {appointment.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Заметки</h3>
              </div>
              <p className="text-gray-600 text-sm">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Футер с кнопками */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>

          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(appointment)}
                disabled={loading}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                Редактировать
              </button>
            )}
            
            {onCreateOrder && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {loading ? 'Создание...' : 'Создать заказ-наряд'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

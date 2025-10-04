'use client'

import { useState, useEffect } from 'react'
import { X, Search, Clock, Calendar, Wrench } from 'lucide-react'

interface Service {
  id: string
  name: string
  price: number
  duration: number
  category: string
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
  }
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
}

interface EditAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appointment: Appointment | null
}

export function EditAppointmentModal({ isOpen, onClose, onSuccess, appointment }: EditAppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED',
    notes: ''
  })

  useEffect(() => {
    if (isOpen && appointment) {
      setFormData({
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        notes: appointment.notes || ''
      })
      setSelectedService({
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        duration: appointment.service.duration,
        category: ''
      })
      loadServices()
    }
  }, [isOpen, appointment])

  useEffect(() => {
    if (serviceSearch) {
      const filtered = services.filter(service => 
        service.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.category?.toLowerCase().includes(serviceSearch.toLowerCase())
      )
      setFilteredServices(filtered)
    } else {
      setFilteredServices(services.slice(0, 20))
    }
  }, [serviceSearch, services])

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setServices(data.services)
          setFilteredServices(data.services.slice(0, 20))
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setServiceSearch('')
    
    // Автоматически пересчитываем время окончания
    const [hours, minutes] = formData.startTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + service.duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    
    setFormData(prev => ({ ...prev, endTime }))
  }

  const handleStartTimeChange = (startTime: string) => {
    setFormData(prev => ({ ...prev, startTime }))
    
    if (selectedService) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + selectedService.duration
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      setFormData(prev => ({ ...prev, endTime }))
    }
  }

  const handleSubmit = async () => {
    if (!appointment || !selectedService) {
      alert('Заполните все поля')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          status: formData.status,
          notes: formData.notes
        })
      })

      if (response.ok) {
        alert('Запись успешно обновлена!')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка при обновлении записи')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка при обновлении записи')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Редактировать запись</h2>
            <p className="text-sm text-gray-500 mt-1">{appointment.client.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Услуга */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Wrench className="inline w-4 h-4 mr-1" />
              Услуга
            </label>

            {selectedService ? (
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{selectedService.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedService.duration} мин • {selectedService.price.toLocaleString()} ₽
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Изменить
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Поиск услуги..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {serviceSearch && (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                            <p className="text-xs text-gray-500">{service.category}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="font-bold text-gray-900 text-sm">{service.price.toLocaleString()} ₽</p>
                            <p className="text-xs text-gray-500">{service.duration} мин</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredServices.length === 0 && (
                      <p className="text-center text-gray-500 py-4 text-sm">Услуги не найдены</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Дата
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Время */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Время начала
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Время окончания
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="SCHEDULED">Запланирована</option>
              <option value="CONFIRMED">Подтверждена</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="COMPLETED">Завершена</option>
              <option value="CANCELLED">Отменена</option>
            </select>
          </div>

          {/* Заметки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Заметки</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Дополнительная информация..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedService}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  )
}

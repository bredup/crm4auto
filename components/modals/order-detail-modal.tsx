'use client'

import { useState, useEffect } from 'react'
import { X, User, Phone, Car, Wrench, DollarSign, Calendar, AlertCircle, Plus, Trash2, Search, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Order {
  id: string
  orderNumber?: string
  description: string
  status: string
  priority: string
  totalCost?: number
  estimatedCost?: number
  estimatedDate: string
  notes?: string
  client: {
    id: string
    name: string
    phone: string
  }
  vehicle?: {
    id: string
    brand: string
    model: string
    year: number
    licensePlate?: string
  }
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
  category: string
}

interface Part {
  id?: string
  name: string
  quantity: number
  price: number
}

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
  onUpdate?: () => void
}

export function OrderDetailModal({ isOpen, onClose, orderId, onUpdate }: OrderDetailModalProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  
  const [parts, setParts] = useState<Part[]>([])
  const [newPart, setNewPart] = useState({ name: '', quantity: 1, price: 0 })
  
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrder()
      loadServices()
    }
  }, [isOpen, orderId])

  useEffect(() => {
    if (serviceSearch) {
      const filtered = services.filter(service => 
        service.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.category?.toLowerCase().includes(serviceSearch.toLowerCase())
      )
      setFilteredServices(filtered)
    } else {
      setFilteredServices([])
    }
  }, [serviceSearch, services])

  const loadOrder = async () => {
    if (!orderId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOrder(data.order)
          setFormData({
            status: data.order.status,
            priority: data.order.priority,
            notes: data.order.notes || ''
          })
          // TODO: Загрузить услуги и запчасти заказа из API
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setServices(data.services)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error)
    }
  }

  const addService = (service: Service) => {
    if (!selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(prev => [...prev, service])
      setServiceSearch('')
    }
  }

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId))
  }

  const addPart = () => {
    if (!newPart.name || newPart.quantity <= 0 || newPart.price <= 0) {
      alert('Заполните все поля запчасти')
      return
    }
    setParts(prev => [...prev, { ...newPart, id: Date.now().toString() }])
    setNewPart({ name: '', quantity: 1, price: 0 })
  }

  const removePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0)
    const partsTotal = parts.reduce((sum, p) => sum + (p.quantity * p.price), 0)
    return servicesTotal + partsTotal
  }

  const handleSave = async () => {
    if (!orderId) return

    setLoading(true)
    try {
      const totalCost = calculateTotal()
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalCost: totalCost > 0 ? totalCost : (order?.totalCost || order?.estimatedCost || 0),
          services: selectedServices.map(s => s.id),
          parts: parts
        })
      })

      if (response.ok) {
        alert('Заказ обновлён!')
        loadOrder()
        setEditing(false)
        onUpdate?.()
      } else {
        alert('Ошибка обновления заказа')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка обновления заказа')
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'RECEIVED': 'Принят',
      'NEW': 'Новый',
      'IN_PROGRESS': 'В работе',
      'COMPLETED': 'Завершён',
      'CANCELLED': 'Отменён',
      'PENDING': 'Ожидание'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'RECEIVED': 'bg-blue-100 text-blue-800',
      'NEW': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      'LOW': 'Низкий',
      'NORMAL': 'Обычный',
      'HIGH': 'Высокий',
      'URGENT': 'Срочный'
    }
    return labels[priority] || priority
  }

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'LOW': 'bg-green-100 text-green-800',
      'NORMAL': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen) return null

  if (loading && !order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Заказ-наряд {order.orderNumber || `#${order.id.slice(0, 8)}`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(order.estimatedDate), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto space-y-6">
          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RECEIVED">Принят</option>
                  <option value="NEW">Новый</option>
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="COMPLETED">Завершён</option>
                  <option value="CANCELLED">Отменён</option>
                  <option value="PENDING">Ожидание</option>
                </select>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Низкий</option>
                  <option value="NORMAL">Обычный</option>
                  <option value="HIGH">Высокий</option>
                  <option value="URGENT">Срочный</option>
                </select>
              </>
            ) : (
              <>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(order.priority)}`}>
                  {getPriorityLabel(order.priority)}
                </span>
              </>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Клиент</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">{order.client.name}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{order.client.phone}</span>
              </div>
            </div>
          </div>

          {order.vehicle && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Автомобиль</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
                </p>
                {order.vehicle.licensePlate && (
                  <p className="text-gray-600">
                    Гос. номер: <span className="font-medium">{order.vehicle.licensePlate}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Описание работ</h3>
            </div>
            <p className="text-gray-700">{order.description}</p>
          </div>

          {editing && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Услуги</h3>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Поиск услуги для добавления..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {serviceSearch && filteredServices.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 mb-3">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => addService(service)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                            <p className="text-xs text-gray-500">{service.category}</p>
                          </div>
                          <p className="font-bold text-gray-900 text-sm">{service.price.toLocaleString()} ₽</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="space-y-2">
                    {selectedServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                          <p className="text-xs text-gray-500">{service.duration} мин</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-gray-900">{service.price.toLocaleString()} ₽</p>
                          <button
                            onClick={() => removeService(service.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Использованные запчасти</h3>
                </div>

                <div className="grid grid-cols-12 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Название запчасти"
                    value={newPart.name}
                    onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Кол-во"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="Цена"
                    value={newPart.price}
                    onChange={(e) => setNewPart(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="0"
                  />
                  <button
                    onClick={addPart}
                    className="col-span-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    
                  </button>
                </div>

                {parts.length > 0 && (
                  <div className="space-y-2">
                    {parts.map((part, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{part.name}</p>
                          <p className="text-xs text-gray-500">Количество: {part.quantity} шт</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-gray-900">{(part.quantity * part.price).toLocaleString()} ₽</p>
                          <button
                            onClick={() => removePart(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Итоговая стоимость</h3>
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {editing 
                  ? calculateTotal().toLocaleString()
                  : (order.totalCost || order.estimatedCost || 0).toLocaleString()
                } ₽
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Заметки</h3>
            </div>
            {editing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder="Дополнительная информация..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-gray-600 text-sm">{order.notes || 'Нет заметок'}</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 sticky bottom-0">
          <div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-medium"
              >
                Редактировать
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false)
                    setSelectedServices([])
                    setParts([])
                    setFormData({
                      status: order.status,
                      priority: order.priority,
                      notes: order.notes || ''
                    })
                  }}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl transition-colors font-medium"
              >
                Закрыть
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

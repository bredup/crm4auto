'use client'

import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, MapPin, Car, FileText, Plus, Trash2, Calendar, Edit, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { OrderDetailModal } from '@/components/modals/order-detail-modal'

interface Client {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  notes?: string | null
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  licensePlate?: string | null
}

interface Order {
  id: string
  orderNumber?: string
  status: string
  description: string
  estimatedCost?: number
  createdAt: string
  vehicle?: Vehicle
}

interface ClientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
}

export function ClientDetailModal({ isOpen, onClose, client }: ClientDetailModalProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  
  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: ''
  })

  useEffect(() => {
    if (isOpen && client) {
      loadClientData()
    }
  }, [isOpen, client])

  const loadClientData = async () => {
    if (!client) return
    
    setLoading(true)
    try {
      const [vehiclesRes, ordersRes] = await Promise.all([
        fetch(`/api/vehicles?clientId=${client.id}`),
        fetch(`/api/orders?clientId=${client.id}`)
      ])

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        if (vehiclesData.success) {
          setVehicles(vehiclesData.vehicles || [])
        }
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])
      }
    } catch (error) {
      console.error('Error loading client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          ...vehicleForm
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowAddVehicle(false)
        setVehicleForm({
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: ''
        })
        loadClientData()
      } else {
        alert(data.error || 'Ошибка добавления автомобиля')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Ошибка добавления автомобиля')
    }
  }

  const handleDeleteVehicle = async (vehicleId: string, vehicleName: string) => {
    if (!confirm(`Удалить ${vehicleName}?`)) return

    try {
      const response = await fetch(`/api/vehicles?id=${vehicleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadClientData()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'RECEIVED': 'Принят',
      'NEW': 'Новый',
      'IN_PROGRESS': 'В работе',
      'COMPLETED': 'Завершён',
      'CANCELLED': 'Отменён'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'RECEIVED': 'bg-blue-100 text-blue-800',
      'NEW': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Детали клиента</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Контактная информация</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{client.phone}</span>
              </div>
              
              {client.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{client.email}</span>
                </div>
              )}
              
              {client.address && (
                <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{client.address}</span>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-3 p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600">{client.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Автомобили</h3>
              </div>
              <button
                onClick={() => setShowAddVehicle(!showAddVehicle)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Добавить авто
              </button>
            </div>

            {showAddVehicle && (
              <form onSubmit={handleAddVehicle} className="p-4 bg-blue-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Марка *"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Модель *"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Год"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                  <input
                    type="text"
                    placeholder="Гос. номер"
                    value={vehicleForm.licensePlate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value.toUpperCase() })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddVehicle(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-gray-200">
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vehicle.year} {vehicle.licensePlate && `• ${vehicle.licensePlate}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id, `${vehicle.brand} ${vehicle.model}`)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Car className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Нет добавленных автомобилей</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Заказ-наряды</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {order.orderNumber || `#${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.createdAt), 'd MMM yyyy', { locale: ru })}
                      </div>
                      
                      {order.vehicle && (
                        <div className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          {order.vehicle.brand} {order.vehicle.model}
                        </div>
                      )}

                      {order.estimatedCost && (
                        <div className="font-semibold text-green-600">
                          {order.estimatedCost.toLocaleString()} ₽
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Нет заказов</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl transition-colors font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

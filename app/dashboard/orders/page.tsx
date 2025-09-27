'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Search, FileText, User, Car, Phone, Calendar, 
  DollarSign, Edit, Eye, Clock, CheckCircle 
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  description: string
  status: string
  priority: string
  estimatedCost: number | null
  estimatedDate: string | null
  createdAt: string
  client: {
    id: string
    name: string
    phone: string
  }
  vehicle: {
    id: string
    brand: string
    model: string
    licensePlate: string | null
    year: number
  } | null
  createdBy: {
    name: string
  }
}

interface Client {
  id: string
  name: string
  phone: string
}

interface Vehicle {
  id: string
  brand: string
  model: string
  licensePlate: string | null
  year: number
  clientId: string
}

const statusLabels = {
  RECEIVED: 'Принят',
  IN_PROGRESS: 'В работе',
  WAITING_PARTS: 'Ожидает запчасти',
  READY: 'Готов',
  COMPLETED: 'Выдан',
  CANCELLED: 'Отменен'
}

const statusColors = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const priorityLabels = {
  LOW: 'Низкий',
  NORMAL: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный'
}

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newOrder, setNewOrder] = useState({
    clientId: '',
    vehicleId: '',
    description: '',
    priority: 'NORMAL',
    estimatedCost: '',
    estimatedDate: '',
    notes: ''
  })

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/orders?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles?limit=100')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewOrder({
          clientId: '', vehicleId: '', description: '', priority: 'NORMAL',
          estimatedCost: '', estimatedDate: '', notes: ''
        })
        await fetchOrders()
      }
    } catch (error) {
      console.error('Error creating order:', error)
    } finally {
      setCreating(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const getClientVehicles = (clientId: string) => {
    return vehicles.filter(vehicle => vehicle.clientId === clientId)
  }

  useEffect(() => {
    fetchOrders()
    fetchClients()
    fetchVehicles()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [search, statusFilter])

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
          <h1 className="text-3xl font-bold text-gray-900">Заказ-наряды</h1>
          <p className="text-gray-600">Управление заказами автосервиса ({orders.length})</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать заказ-наряд
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск по номеру, описанию, клиенту или автомобилю..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Все статусы</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Создать новый заказ-наряд</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Клиент *</label>
                  <select 
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newOrder.clientId}
                    onChange={(e) => {
                      setNewOrder({...newOrder, clientId: e.target.value, vehicleId: ''})
                    }}
                  >
                    <option value="">Выберите клиента</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Автомобиль</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newOrder.vehicleId}
                    onChange={(e) => setNewOrder({...newOrder, vehicleId: e.target.value})}
                    disabled={!newOrder.clientId}
                  >
                    <option value="">Без автомобиля</option>
                    {getClientVehicles(newOrder.clientId).map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                        {vehicle.licensePlate && ` - ${vehicle.licensePlate}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Приоритет</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
                  >
                    {Object.entries(priorityLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Предварительная стоимость</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="25000"
                    value={newOrder.estimatedCost}
                    onChange={(e) => setNewOrder({...newOrder, estimatedCost: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Описание работ *</label>
                <textarea
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={4}
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({...newOrder, description: e.target.value})}
                  placeholder="Описание неисправности и требуемых работ..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={creating}
                >
                  {creating ? 'Создание...' : 'Создать заказ-наряд'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.orderNumber}
                      </h3>
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge className={priorityColors[order.priority as keyof typeof priorityColors]}>
                        {priorityLabels[order.priority as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{order.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {order.client.name} - {order.client.phone}
                      </div>
                      
                      {order.vehicle && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Car className="w-4 h-4" />
                          {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
                        </div>
                      )}
                      
                      {order.estimatedCost && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          ₽{order.estimatedCost.toLocaleString()}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Создан: {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <div className="flex gap-1">
                        {order.status === 'RECEIVED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            В работу
                          </Button>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Готов
                          </Button>
                        )}
                        {order.status === 'READY' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                            className="bg-gray-600 hover:bg-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Выдать
                          </Button>
                        )}
                      </div>
                    )}
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4">
                {search || statusFilter ? 'Заказ-наряды не найдены' : 'Пока нет созданных заказ-нарядов'}
              </p>
              {!search && !statusFilter && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первый заказ-наряд
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

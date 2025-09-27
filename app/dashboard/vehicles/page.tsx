'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Car, User, Phone, FileText, Edit, Trash2 } from 'lucide-react'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  vin: string | null
  licensePlate: string | null
  color: string | null
  mileage: number | null
  client: {
    id: string
    name: string
    phone: string
  }
  ordersCount: number
  activeOrdersCount: number
  createdAt: string
}

interface Client {
  id: string
  name: string
  phone: string
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newVehicle, setNewVehicle] = useState({
    clientId: '',
    brand: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    color: '',
    mileage: '',
    notes: ''
  })

  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/vehicles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
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

  const createVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewVehicle({
          clientId: '', brand: '', model: '', year: '', vin: '',
          licensePlate: '', color: '', mileage: '', notes: ''
        })
        fetchVehicles()
      }
    } catch (error) {
      console.error('Error creating vehicle:', error)
    }
  }

  useEffect(() => {
    fetchVehicles()
    fetchClients()
  }, [search])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Автомобили</h1>
          <p className="text-gray-600">Управление автопарком клиентов</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить автомобиль
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по марке, модели, номеру, VIN или владельцу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Vehicle Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить новый автомобиль</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createVehicle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Клиент *</label>
                  <select 
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newVehicle.clientId}
                    onChange={(e) => setNewVehicle({...newVehicle, clientId: e.target.value})}
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
                  <label className="block text-sm font-medium mb-2">Марка *</label>
                  <Input
                    required
                    placeholder="Toyota, BMW, Mercedes..."
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Модель *</label>
                  <Input
                    required
                    placeholder="Camry, X5, E-Class..."
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Год *</label>
                  <Input
                    required
                    type="number"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Гос. номер</label>
                  <Input
                    placeholder="А123БВ78"
                    value={newVehicle.licensePlate}
                    onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">VIN</label>
                  <Input
                    placeholder="1HGBH41JXMN109186"
                    value={newVehicle.vin}
                    onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Цвет</label>
                  <Input
                    placeholder="Черный, Белый, Серый..."
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Пробег (км)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50000"
                    value={newVehicle.mileage}
                    onChange={(e) => setNewVehicle({...newVehicle, mileage: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Заметки</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newVehicle.notes}
                  onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})}
                  placeholder="Дополнительная информация об автомобиле..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Добавить автомобиль
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

      {/* Vehicles List */}
      <div className="grid gap-4">
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {vehicle.client.name}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {vehicle.client.phone}
                      </div>

                      {vehicle.licensePlate && (
                        <div className="text-sm text-gray-600">
                          <strong>Номер:</strong> {vehicle.licensePlate}
                        </div>
                      )}
                      
                      {vehicle.color && (
                        <div className="text-sm text-gray-600">
                          <strong>Цвет:</strong> {vehicle.color}
                        </div>
                      )}
                      
                      {vehicle.mileage && (
                        <div className="text-sm text-gray-600">
                          <strong>Пробег:</strong> {vehicle.mileage.toLocaleString()} км
                        </div>
                      )}
                      
                      {vehicle.vin && (
                        <div className="text-sm text-gray-600 font-mono">
                          <strong>VIN:</strong> {vehicle.vin}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {vehicle.ordersCount} заказов
                      </Badge>
                      {vehicle.activeOrdersCount > 0 && (
                        <Badge className="flex items-center gap-1 bg-orange-100 text-orange-800">
                          <FileText className="w-3 h-3" />
                          {vehicle.activeOrdersCount} активных
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Car className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4">
                {search ? 'Автомобили не найдены' : 'Пока нет добавленных автомобилей'}
              </p>
              {!search && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первый автомобиль
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

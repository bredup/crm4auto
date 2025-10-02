'use client'

import { useState, useEffect } from 'react'
import { X, Search, Car, User, Wrench, Plus } from 'lucide-react'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Client {
  id: string
  name: string
  phone: string
  email?: string
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  licensePlate?: string
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
  category: string
}

export function OrderModal({ isOpen, onClose, onSuccess }: OrderModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Шаг 1: Клиент
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  })
  
  // Шаг 2: Автомобиль
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false)
  const [newVehicleData, setNewVehicleData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: ''
  })
  
  // Шаг 3: Услуги
  const [serviceSearch, setServiceSearch] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [priority, setPriority] = useState('NORMAL')
  const [description, setDescription] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('1')

  useEffect(() => {
    if (isOpen) {
      loadServices()
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedClient) {
      loadVehicles()
    }
  }, [selectedClient])

  useEffect(() => {
    if (serviceSearch) {
      const filtered = services.filter(service => 
        service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.category.toLowerCase().includes(serviceSearch.toLowerCase())
      )
      setFilteredServices(filtered)
    } else {
      setFilteredServices(services.slice(0, 20))
    }
  }, [serviceSearch, services])

  const searchClients = async (query: string) => {
    if (!query.trim()) {
      setClients([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/clients?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Ошибка поиска клиентов:', error)
    } finally {
      setLoading(false)
    }
  }

  const createClient = async () => {
    if (!newClientData.firstName || !newClientData.lastName || !newClientData.phone) {
      alert('Заполните все обязательные поля')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      })

      const data = await response.json()
      if (data.success) {
        const clientWithName = {
          ...data.client,
          name: `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim() || data.client.name
        }
        setSelectedClient(clientWithName)
        setIsCreatingClient(false)
      } else {
        alert(data.error || 'Ошибка создания клиента')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка создания клиента')
    } finally {
      setLoading(false)
    }
  }

  const loadVehicles = async () => {
    if (!selectedClient) return
    try {
      const response = await fetch(`/api/vehicles?clientId=${selectedClient.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVehicles(data.vehicles)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error)
    }
  }

  const createVehicle = async () => {
    if (!newVehicleData.brand || !newVehicleData.model || !selectedClient) {
      alert('Заполните все обязательные поля')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVehicleData,
          clientId: selectedClient.id
        })
      })

      const data = await response.json()
      if (data.success) {
        setSelectedVehicle(data.vehicle)
        setIsCreatingVehicle(false)
        await loadVehicles()
      } else {
        alert(data.error || 'Ошибка создания автомобиля')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка создания автомобиля')
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
          setFilteredServices(data.services.slice(0, 20))
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error)
    }
  }

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) {
        return prev.filter(s => s.id !== service.id)
      } else {
        return [...prev, service]
      }
    })
  }

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0)
  }

  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicle || selectedServices.length === 0) {
      alert('Заполните все обязательные поля')
      return
    }

    setLoading(true)
    try {
      const startDateObj = new Date(orderDate)
      const estimatedDate = new Date(startDateObj)
      estimatedDate.setDate(estimatedDate.getDate() + parseInt(estimatedDays))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          vehicleId: selectedVehicle.id,
          description: description || `Услуги: ${selectedServices.map(s => s.name).join(', ')}`,
          priority: priority,
          estimatedCost: calculateTotal(),
          estimatedDate: estimatedDate.toISOString(),
          notes: `Выбранные услуги: ${selectedServices.map(s => s.name).join(', ')}`
        })
      })

      if (response.ok) {
        alert('Заказ-наряд успешно создан!')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания заказ-наряда')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка создания заказ-наряда')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSearchQuery('')
    setClients([])
    setSelectedClient(null)
    setIsCreatingClient(false)
    setVehicles([])
    setSelectedVehicle(null)
    setIsCreatingVehicle(false)
    setSelectedServices([])
    setServiceSearch('')
    setOrderDate(new Date().toISOString().split('T')[0])
    setPriority('NORMAL')
    setDescription('')
    setEstimatedDays('1')
    setNewClientData({
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    })
    setNewVehicleData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: ''
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Новый заказ-наряд</h2>
            <p className="text-sm text-gray-500 mt-1">Шаг {step} из 3</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Прогресс */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
            </div>
            
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= num ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {num}
                </div>
                <span className="text-xs mt-2 text-gray-600 font-medium">
                  {num === 1 ? 'Клиент' : num === 2 ? 'Автомобиль' : 'Услуги'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Шаг 1: Клиент */}
          {step === 1 && !isCreatingClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Выберите клиента</h3>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по имени или телефону..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchClients(e.target.value)
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {selectedClient ? (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                      <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                      {selectedClient.email && (
                        <p className="text-sm text-gray-500">{selectedClient.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                      >
                        <p className="font-semibold text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                        {client.email && (
                          <p className="text-sm text-gray-500">{client.email}</p>
                        )}
                      </div>
                    ))}
                    {searchQuery.length >= 2 && clients.length === 0 && !loading && (
                      <p className="text-center text-gray-500 py-8">Клиенты не найдены</p>
                    )}
                    {searchQuery.length < 2 && (
                      <p className="text-center text-gray-500 py-8">Введите минимум 2 символа для поиска</p>
                    )}
                    {loading && (
                      <p className="text-center text-gray-500 py-8">Поиск...</p>
                    )}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      onClick={() => setIsCreatingClient(true)}
                      className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Создать нового клиента
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Форма создания клиента */}
          {step === 1 && isCreatingClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Новый клиент</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Имя *</label>
                  <input
                    type="text"
                    value={newClientData.firstName}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия *</label>
                  <input
                    type="text"
                    value={newClientData.lastName}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Иванов"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон *</label>
                <input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="client@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreatingClient(false)}
                  className="flex-1 px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={createClient}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          )}

          {/* Шаг 2: Автомобиль */}
          {step === 2 && !isCreatingVehicle && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Выберите автомобиль</h3>
              </div>

              {selectedVehicle ? (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                      </p>
                      {selectedVehicle.licensePlate && (
                        <p className="text-sm text-gray-600">{selectedVehicle.licensePlate}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedVehicle(null)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                      >
                        <p className="font-semibold text-gray-900">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </p>
                        {vehicle.licensePlate && (
                          <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
                        )}
                      </div>
                    ))}
                    {vehicles.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        У клиента нет добавленных автомобилей
                      </p>
                    )}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      onClick={() => setIsCreatingVehicle(true)}
                      className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить новый автомобиль
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Форма создания автомобиля */}
          {step === 2 && isCreatingVehicle && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Новый автомобиль</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Марка *</label>
                  <input
                    type="text"
                    value={newVehicleData.brand}
                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Модель *</label>
                  <input
                    type="text"
                    value={newVehicleData.model}
                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Camry"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Год *</label>
                  <input
                    type="number"
                    value={newVehicleData.year}
                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Гос. номер</label>
                  <input
                    type="text"
                    value={newVehicleData.licensePlate}
                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="А123БВ777"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreatingVehicle(false)}
                  className="flex-1 px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={createVehicle}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          )}

          {/* Шаг 3: Услуги */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Выберите услуги</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск услуги..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredServices.map((service) => {
                  const isSelected = selectedServices.some(s => s.id === service.id)
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-500">{service.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{service.price.toLocaleString()} ₽</p>
                          <p className="text-xs text-gray-500">{service.duration} мин</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedServices.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Выбрано услуг: {selectedServices.length}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateTotal().toLocaleString()} ₽
                  </p>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата начала работ
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Приоритет
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Низкий</option>
                      <option value="NORMAL">Обычный</option>
                      <option value="HIGH">Высокий</option>
                      <option value="URGENT">Срочный</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Срок выполнения (дней)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание работ
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Опишите требуемые работы..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            {step > 1 && !isCreatingClient && !isCreatingVehicle && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Назад
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              Отмена
            </button>
            
            {step < 3 && !isCreatingClient && !isCreatingVehicle ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedClient) ||
                  (step === 2 && !selectedVehicle)
                }
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Далее
              </button>
            ) : step === 3 ? (
              <button
                onClick={handleSubmit}
                disabled={loading || selectedServices.length === 0}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать заказ-наряд'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

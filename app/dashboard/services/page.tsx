'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EditServiceDialog } from '@/components/services/edit-service-dialog'
import { 
  Plus, Search, Wrench, Clock, DollarSign, Edit, 
  EyeOff, Eye, Tag
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number | null
  category: string | null
  active: boolean
  createdAt: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('true')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Состояние для редактирования
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: ''
  })

  const fetchServices = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter) params.append('category', categoryFilter)
      if (activeFilter) params.append('active', activeFilter)
      
      const response = await fetch(`/api/services?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const createService = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewService({
          name: '', description: '', price: '', duration: '', category: ''
        })
        await fetchServices()
      }
    } catch (error) {
      console.error('Error creating service:', error)
    } finally {
      setCreating(false)
    }
  }

  const toggleServiceStatus = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          category: service.category,
          active: !service.active
        })
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Error updating service status:', error)
    }
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setIsEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchServices()
    setSelectedService(null)
  }

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    fetchServices()
  }, [search, categoryFilter, activeFilter])

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
          <h1 className="text-3xl font-bold text-gray-900">Услуги</h1>
          <p className="text-gray-600">Справочник услуг автосервиса ({services.length})</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить услугу
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск по названию, описанию или категории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">Все услуги</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Форма создания услуги */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить новую услугу</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название *</label>
                  <Input
                    required
                    placeholder="Замена масла, Диагностика..."
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Категория</label>
                  <Input
                    placeholder="ТО, Ремонт, Диагностика..."
                    value={newService.category}
                    onChange={(e) => setNewService({...newService, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Цена (₽) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Время выполнения (мин)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="60"
                    value={newService.duration}
                    onChange={(e) => setNewService({...newService, duration: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="Подробное описание услуги..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={creating}
                >
                  {creating ? 'Создание...' : 'Создать услугу'}
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

      {/* Список услуг */}
      <div className="grid gap-4">
        {services.length > 0 ? (
          services.map((service) => (
            <Card key={service.id} className={`hover:shadow-md transition-shadow ${!service.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      {service.category && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {service.category}
                        </Badge>
                      )}
                      <Badge variant={service.active ? "default" : "secondary"}>
                        {service.active ? 'Активна' : 'Неактивна'}
                      </Badge>
                    </div>
                    
                    {service.description && (
                      <p className="text-gray-700 mb-3">{service.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                        <DollarSign className="w-5 h-5" />
                        ₽{service.price.toLocaleString()}
                      </div>
                      
                      {service.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {service.duration} мин
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        Создана: {new Date(service.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleServiceStatus(service)}
                      className={service.active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {service.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="w-4 h-4" />
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
                <Wrench className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4">
                {search || categoryFilter ? 'Услуги не найдены' : 'Пока нет добавленных услуг'}
              </p>
              {!search && !categoryFilter && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первую услугу
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Диалог редактирования */}
      <EditServiceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        service={selectedService}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

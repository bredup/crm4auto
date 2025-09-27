'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Phone, Mail, MapPin, Car, FileText, Edit, Trash2, Users } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string
  address: string | null
  vehiclesCount: number
  ordersCount: number
  createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Форма для нового клиента
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/clients?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewClient({ name: '', email: '', phone: '', address: '', notes: '' })
        fetchClients()
      }
    } catch (error) {
      console.error('Error creating client:', error)
    }
  }

  useEffect(() => {
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
          <h1 className="text-3xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600">Управление базой клиентов автосервиса</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить клиента
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по имени, email или телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Client Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить нового клиента</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Имя *</label>
                  <Input
                    required
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Телефон *</label>
                  <Input
                    required
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Адрес</label>
                  <Input
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Заметки</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  placeholder="Дополнительная информация о клиенте..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Создать клиента
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

      {/* Clients List */}
      <div className="grid gap-4">
        {clients.length > 0 ? (
          clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {client.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </div>
                      
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                      )}
                      
                      {client.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {client.address}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        Клиент с: {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {client.vehiclesCount} авто
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {client.ordersCount} заказов
                      </Badge>
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
                <Users className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4">
                {search ? 'Клиенты не найдены' : 'Пока нет добавленных клиентов'}
              </p>
              {!search && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первого клиента
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

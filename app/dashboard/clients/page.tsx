'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Phone, Mail, MapPin, Users } from 'lucide-react'
import { ClientDetailModal } from '@/components/modals/client-detail-modal'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string
  address: string | null
  createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
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

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    let digits = cleaned;
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7')) {
      digits = '7' + digits;
    }
    if (digits.length >= 1) {
      let formatted = '+7';
      if (digits.length > 1) {
        formatted += ' (' + digits.slice(1, 4);
        if (digits.length >= 4) {
          formatted += ')';
        }
        if (digits.length > 4) {
          formatted += ' ' + digits.slice(4, 7);
        }
        if (digits.length > 7) {
          formatted += '-' + digits.slice(7, 9);
        }
        if (digits.length > 9) {
          formatted += '-' + digits.slice(9, 11);
        }
      }
      return formatted;
    }
    return value;
  };

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const phoneDigits = newClient.phone.replace(/\D/g, '');
    if (!newClient.firstName.trim() || !newClient.lastName.trim() || phoneDigits.length < 10) {
      alert('Заполните все обязательные поля корректно');
      return;
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewClient({ firstName: '', lastName: '', phone: '', email: '', address: '', notes: '' })
        fetchClients()
      }
    } catch (error) {
      console.error('Error creating client:', error)
    }
  }

  const handleClientClick = (client: Client) => {
    setSelectedClient(client)
    setIsDetailModalOpen(true)
  }

  const handleModalClose = () => {
    setIsDetailModalOpen(false)
    setSelectedClient(null)
    fetchClients()
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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600">Управление базой клиентов автосервиса</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить клиента
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            placeholder="Поиск по имени, email или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Добавить нового клиента</h2>
          <form onSubmit={createClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Имя *</label>
                <input
                  required
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Иван"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия *</label>
                <input
                  required
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Иванов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон *</label>
                <input
                  required
                  value={newClient.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setNewClient({...newClient, phone: formatted});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
                  maxLength={18}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="client@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Адрес</label>
                <input
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Город, улица, дом"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Заметки</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                value={newClient.notes}
                onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                placeholder="Дополнительная информация о клиенте..."
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Создать клиента
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {clients.length > 0 ? (
          clients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleClientClick(client)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {client.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 mb-4">
              {search ? 'Клиенты не найдены' : 'Пока нет добавленных клиентов'}
            </p>
            {!search && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить первого клиента
              </button>
            )}
          </div>
        )}
      </div>

      <ClientDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
        client={selectedClient}
      />
    </div>
  )
}

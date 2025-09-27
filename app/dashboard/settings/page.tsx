'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, Building, Bell, Shield, Database,
  Save, Users, FileText, Package, Check, AlertCircle
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  
  const [companySettings, setCompanySettings] = useState({
    name: 'CRM4Auto',
    description: 'Система управления автосервисом',
    address: '',
    phone: '',
    email: '',
    website: ''
  })

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  // Проверка доступа - только для админов
  if (session?.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Card className="text-center p-8">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Доступ ограничен</h2>
          <p className="text-gray-600">Только администраторы могут изменять настройки системы</p>
        </Card>
      </div>
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      showNotification('success', 'Настройки сохранены')
    } catch (error) {
      showNotification('error', 'Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Уведомления */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Настройки системы</h1>
        <p className="text-gray-600">Управление конфигурацией CRM4Auto</p>
      </div>

      {/* Настройки компании */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Настройки компании
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название компании *</label>
              <Input
                value={companySettings.name}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="CRM4Auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Описание</label>
              <Input
                value={companySettings.description}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Система управления автосервисом"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Адрес</label>
            <Input
              value={companySettings.address}
              onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
              placeholder="г. Москва, ул. Примерная, д. 1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Телефон</label>
              <Input
                value={companySettings.phone}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={companySettings.email}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@crm4auto.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Веб-сайт</label>
              <Input
                value={companySettings.website}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://crm4auto.com"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </CardContent>
      </Card>

      {/* Статистика системы */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика системы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Пользователи</span>
            </div>
            <span className="font-medium">0</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-sm">Заказы</span>
            </div>
            <span className="font-medium">0</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Запчасти</span>
            </div>
            <span className="font-medium">0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

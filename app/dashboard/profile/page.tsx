'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, Mail, Calendar, Save, Eye, EyeOff, 
  Crown, Briefcase, FileText, Users as UsersIcon,
  Check, AlertCircle
} from 'lucide-react'

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || ''
      }))
    }
  }, [session])

  const getRoleInfo = (role: string) => {
    const roleMap = {
      ADMIN: { 
        label: 'Администратор', 
        icon: Crown, 
        color: 'bg-red-100 text-red-800',
        description: 'Полный доступ ко всем функциям системы'
      },
      MANAGER: { 
        label: 'Менеджер', 
        icon: Briefcase, 
        color: 'bg-blue-100 text-blue-800',
        description: 'Управление клиентами, заказами и отчетами'
      },
      EMPLOYEE: { 
        label: 'Сотрудник', 
        icon: User, 
        color: 'bg-green-100 text-green-800',
        description: 'Работа с клиентами и заказ-нарядами'
      }
    }
    return roleMap[role as keyof typeof roleMap] || roleMap.EMPLOYEE
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      showNotification('error', 'Новые пароли не совпадают')
      return
    }

    if (profileData.newPassword && profileData.newPassword.length < 6) {
      showNotification('error', 'Пароль должен содержать минимум 6 символов')
      return
    }

    setLoading(true)

    try {
      const updateData: any = {
        name: profileData.name,
        email: profileData.email
      }

      if (profileData.newPassword) {
        updateData.password = profileData.newPassword
      }

      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Обновляем сессию
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: profileData.name,
            email: profileData.email
          }
        })

        // Очищаем поля паролей
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))

        showNotification('success', 'Профиль успешно обновлен')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification('error', 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Загрузка...</div>
  }

  const roleInfo = getRoleInfo(session.user.role)
  const RoleIcon = roleInfo.icon

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
        <h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>
        <p className="text-gray-600">Управление личной информацией и настройками аккаунта</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Информация о пользователе */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Аватар */}
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                    {session.user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{session.user.name}</h3>
                <p className="text-gray-500">{session.user.email}</p>
              </div>

              {/* Роль */}
              <div className="text-center">
                <Badge className={`${roleInfo.color} flex items-center gap-2 justify-center`}>
                  <RoleIcon className="w-4 h-4" />
                  {roleInfo.label}
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  {roleInfo.description}
                </p>
              </div>

              {/* Дата регистрации */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Зарегистрирован: {new Date(Date.now()).toLocaleDateString('ru-RU')}</span>
              </div>

              {/* Статистика */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Создано заказов</span>
                  </div>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Назначено заказов</span>
                  </div>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Форма редактирования */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Редактировать профиль</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Основная информация */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Основная информация</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Полное имя *
                      </label>
                      <Input
                        required
                        placeholder="Ваше полное имя"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email адрес *
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="your@email.com"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Смена пароля */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-medium">Сменить пароль</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Новый пароль
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Минимум 6 символов"
                          value={profileData.newPassword}
                          onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Подтвердите пароль
                      </label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Повторите новый пароль"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Оставьте поля пустыми, если не хотите менять пароль
                  </p>
                </div>

                {/* Кнопки */}
                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setProfileData({
                        name: session.user.name || '',
                        email: session.user.email || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                  >
                    Отменить
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

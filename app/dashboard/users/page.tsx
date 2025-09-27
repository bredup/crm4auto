'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Search, Users, Shield, User, Edit, 
  Eye, EyeOff, X, Check, AlertCircle, Trash2
} from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
  _count: {
    createdOrders: number
    assignedOrders: number
  }
}

const roleLabels = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',  
  EMPLOYEE: 'Сотрудник'
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  EMPLOYEE: 'bg-green-100 text-green-800'
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('true')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Новый пользователь
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE'
  })

  // Редактируемый пользователь
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    active: true
  })

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)
      if (activeFilter) params.append('active', activeFilter)
      
      const response = await fetch(`/api/users?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        showNotification('error', 'Ошибка загрузки пользователей')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      showNotification('error', 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewUser({ name: '', email: '', password: '', role: 'EMPLOYEE' })
        await fetchUsers()
        showNotification('success', 'Пользователь успешно создан')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Ошибка при создании пользователя')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showNotification('error', 'Ошибка соединения')
    } finally {
      setCreating(false)
    }
  }

  const startEditUser = (user: UserData) => {
    setEditingUser(user)
    setEditUser({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      active: user.active
    })
  }

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setUpdating(true)
    
    try {
      const { password, ...updateData } = editUser
      const finalUpdateData = password ? { ...updateData, password } : updateData	

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUpdateData)
      })

      if (response.ok) {
        setEditingUser(null)
        await fetchUsers()
        showNotification('success', 'Пользователь обновлен')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Ошибка при обновлении')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      showNotification('error', 'Ошибка соединения')
    } finally {
      setUpdating(false)
    }
  }

  const toggleUserStatus = async (user: UserData) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: user.name,
          email: user.email,
          role: user.role,
          active: !user.active
        })
      })

      if (response.ok) {
        fetchUsers()
        showNotification('success', user.active ? 'Пользователь деактивирован' : 'Пользователь активирован')
      } else {
        showNotification('error', 'Ошибка изменения статуса')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      showNotification('error', 'Ошибка соединения')
    }
  }

  const deleteUser = async (user: UserData) => {
    if (!confirm(`Вы уверены, что хотите деактивировать пользователя ${user.name}?`)) {
      return
    }

    setDeleting(user.id)
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchUsers()
        showNotification('success', 'Пользователь деактивирован')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Ошибка при деактивации')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showNotification('error', 'Ошибка соединения')
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, activeFilter])

  // Проверка доступа
  if (session?.user.role !== 'ADMIN' && session?.user.role !== 'MANAGER') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Card className="text-center p-4 sm:p-8 mx-4">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Доступ ограничен</h2>
          <p className="text-gray-600 mb-4">У вас нет прав для просмотра пользователей</p>
          <p className="text-sm text-gray-500">
            Текущая роль: <Badge>{roleLabels[session?.user.role as keyof typeof roleLabels] || 'Неизвестно'}</Badge>
          </p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Загрузка пользователей...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Уведомления */}
      {notification && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm sm:text-base">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-sm sm:text-base text-gray-600 break-words">
            Управление пользователями CRM4Auto ({users.length})
            {search && (
              <span className="block sm:inline">
                <span className="hidden sm:inline"> • </span>Поиск: "{search}"
              </span>
            )}
            {roleFilter && (
              <span className="block sm:inline">
                <span className="hidden sm:inline"> • </span>Роль: {roleLabels[roleFilter as keyof typeof roleLabels]}
              </span>
            )}
          </p>
        </div>
        {session?.user.role === 'ADMIN' && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Добавить пользователя</span>
          </Button>
        )}
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="flex-1 sm:min-w-40 px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Все роли</option>
                <option value="ADMIN">Администраторы</option>
                <option value="MANAGER">Менеджеры</option>
                <option value="EMPLOYEE">Сотрудники</option>
              </select>
              <select 
                className="flex-1 sm:min-w-40 px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="">Все</option>
                <option value="true">Активные</option>
                <option value="false">Неактивные</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Форма создания пользователя */}
      {showCreateForm && session?.user.role === 'ADMIN' && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 p-4 sm:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-900 text-lg sm:text-xl">Добавить нового пользователя</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Имя *</label>
                  <Input
                    required
                    placeholder="Иван Иванов"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    required
                    type="email"
                    placeholder="ivan@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Пароль *</label>
                  <Input
                    required
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Роль *</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="EMPLOYEE">Сотрудник</option>
                    <option value="MANAGER">Менеджер</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  disabled={creating}
                >
                  {creating ? 'Создание...' : 'Создать пользователя'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Форма редактирования пользователя */}
      {editingUser && (
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-orange-50 p-4 sm:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-orange-900 text-lg sm:text-xl break-words pr-2">
                Редактировать: {editingUser.name}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditingUser(null)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={updateUser} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Имя *</label>
                  <Input
                    required
                    value={editUser.name}
                    onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    required
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Новый пароль</label>
                  <Input
                    type="password"
                    placeholder="Оставьте пустым, чтобы не менять"
                    value={editUser.password}
                    onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                  />
                </div>
                {session?.user.role === 'ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Роль *</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={editUser.role}
                      onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                    >
                      <option value="EMPLOYEE">Сотрудник</option>
                      <option value="MANAGER">Менеджер</option>
                      <option value="ADMIN">Администратор</option>
                    </select>
                  </div>
                )}
                {session?.user.role === 'ADMIN' && (
                  <div className="flex items-center space-x-2 lg:col-span-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={editUser.active}
                      onChange={(e) => setEditUser({...editUser, active: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="active" className="text-sm font-medium">
                      Активный пользователь
                    </label>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                  disabled={updating}
                >
                  {updating ? 'Обновление...' : 'Обновить пользователя'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Список пользователей */}
      <div className="grid gap-4">
        {users.length > 0 ? (
          users.map((user) => (
            <Card key={user.id} className={`hover:shadow-md transition-all ${
              !user.active ? 'opacity-60 bg-gray-50' : ''
            } ${
              user.id === session?.user.id ? 'ring-2 ring-blue-200 bg-blue-50' : ''
            }`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-gray-900 break-words">
                            {user.name}
                            {user.id === session?.user.id && (
                              <span className="text-sm text-blue-600 ml-2 font-medium">(Это Вы)</span>
                            )}
                          </h3>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${roleColors[user.role as keyof typeof roleColors]} text-xs`}>
                            {roleLabels[user.role as keyof typeof roleLabels]}
                          </Badge>
                          <Badge variant={user.active ? "default" : "secondary"} className="text-xs">
                            {user.active ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Email</p>
                          <p className="font-medium text-sm sm:text-base break-all">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Создано заказов</p>
                          <p className="font-medium text-blue-600 text-sm sm:text-base">{user._count.createdOrders}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Назначено заказов</p>
                          <p className="font-medium text-green-600 text-sm sm:text-base">{user._count.assignedOrders}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Дата регистрации</p>
                          <p className="font-medium text-sm sm:text-base">
                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    {(session?.user.role === 'ADMIN' || user.id === session?.user.id) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEditUser(user)}
                        className="w-full sm:w-auto justify-center sm:justify-start"
                        title="Редактировать пользователя"
                      >
                        <Edit className="w-4 h-4 sm:mr-2" />
                        <span className="sm:inline ml-2 sm:ml-0">Редактировать</span>
                      </Button>
                    )}
                    {session?.user.role === 'ADMIN' && user.id !== session.user.id && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleUserStatus(user)}
                          className={`w-full sm:w-auto justify-center sm:justify-start ${user.active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
                          title={user.active ? 'Деактивировать' : 'Активировать'}
                        >
                          {user.active ? <EyeOff className="w-4 h-4 sm:mr-2" /> : <Eye className="w-4 h-4 sm:mr-2" />}
                          <span className="sm:inline ml-2 sm:ml-0">{user.active ? 'Деактивировать' : 'Активировать'}</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteUser(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto justify-center sm:justify-start"
                          disabled={deleting === user.id}
                          title="Удалить пользователя"
                        >
                          {deleting === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 sm:mr-2" />
                              <span className="sm:inline ml-2 sm:ml-0">Удалить</span>
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8 sm:py-12 px-4">
              <div className="text-gray-400 mb-4">
                <Users className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4 text-sm sm:text-base">
                {search || roleFilter ? 'Пользователи не найдены по заданным критериям' : 'Пока нет пользователей'}
              </p>
              {!search && !roleFilter && session?.user.role === 'ADMIN' && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первого пользователя
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

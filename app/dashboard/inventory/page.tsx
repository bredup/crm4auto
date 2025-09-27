'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Search, Package, AlertTriangle, DollarSign, 
  Edit, Eye, EyeOff, Tag, Hash, Building2
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  description: string | null
  sku: string | null
  price: number
  cost: number | null
  quantity: number
  minQuantity: number
  category: string | null
  supplier: string | null
  active: boolean
  createdAt: string
}

interface Stats {
  totalItems: number
  lowStockItems: number
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState<Stats>({ totalItems: 0, lowStockItems: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('true')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    quantity: '',
    minQuantity: '',
    category: '',
    supplier: ''
  })

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter) params.append('category', categoryFilter)
      if (activeFilter) params.append('active', activeFilter)
      if (lowStockFilter) params.append('lowStock', 'true')
      
      const response = await fetch(`/api/inventory?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setCategories(data.categories || [])
        setStats(data.stats || { totalItems: 0, lowStockItems: 0 })
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewItem({
          name: '', description: '', sku: '', price: '', cost: '',
          quantity: '', minQuantity: '', category: '', supplier: ''
        })
        await fetchInventory()
      }
    } catch (error) {
      console.error('Error creating item:', error)
    } finally {
      setCreating(false)
    }
  }

  const toggleItemStatus = async (item: InventoryItem) => {
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: item.name,
          description: item.description,
          sku: item.sku,
          price: item.price,
          cost: item.cost,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          category: item.category,
          supplier: item.supplier,
          active: !item.active
        })
      })

      if (response.ok) {
        fetchInventory()
      }
    } catch (error) {
      console.error('Error updating item status:', error)
    }
  }

  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity <= 0) {
      return { label: 'Нет в наличии', color: 'bg-red-100 text-red-800' }
    }
    if (quantity <= minQuantity) {
      return { label: 'Заканчивается', color: 'bg-orange-100 text-orange-800' }
    }
    return { label: 'В наличии', color: 'bg-green-100 text-green-800' }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [search, categoryFilter, activeFilter, lowStockFilter])

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
          <h1 className="text-3xl font-bold text-gray-900">Склад запчастей</h1>
          <p className="text-gray-600">
            Управление складскими остатками ({items.length} позиций)
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить запчасть
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего позиций</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Заканчивается</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Категории</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Tag className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск по названию, артикулу или поставщику..."
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
              <option value="">Все запчасти</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
            <label className="flex items-center gap-2 px-3 py-2">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Только заканчивающиеся</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Форма создания запчасти */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить новую запчасть</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название *</label>
                  <Input
                    required
                    placeholder="Масло моторное 5W-30"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Артикул</label>
                  <Input
                    placeholder="OIL-5W30-4L"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Категория</label>
                  <Input
                    placeholder="Масла, Фильтры, Тормоза..."
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Цена продажи (₽) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1200"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Закупочная цена (₽)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="800"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({...newItem, cost: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Поставщик</label>
                  <Input
                    placeholder="ООО Автозапчасти"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Количество</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Мин. остаток</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={newItem.minQuantity}
                    onChange={(e) => setNewItem({...newItem, minQuantity: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Дополнительная информация о запчасти..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={creating}
                >
                  {creating ? 'Создание...' : 'Добавить запчасть'}
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

      {/* Список запчастей */}
      <div className="grid gap-4">
        {items.length > 0 ? (
          items.map((item) => {
            const stockStatus = getStockStatus(item.quantity, item.minQuantity)
            return (
              <Card key={item.id} className={`hover:shadow-md transition-shadow ${!item.active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        {item.sku && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {item.sku}
                          </Badge>
                        )}
                        {item.category && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {item.category}
                          </Badge>
                        )}
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                        <Badge variant={item.active ? "default" : "secondary"}>
                          {item.active ? 'Активна' : 'Неактивна'}
                        </Badge>
                      </div>
                      
                      {item.description && (
                        <p className="text-gray-700 mb-3">{item.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Остаток</p>
                          <p className="font-semibold text-lg">
                            {item.quantity} шт.
                            {item.quantity <= item.minQuantity && item.quantity > 0 && (
                              <AlertTriangle className="inline w-4 h-4 ml-1 text-orange-500" />
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Мин. остаток</p>
                          <p className="font-medium">{item.minQuantity} шт.</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Цена продажи</p>
                          <p className="font-semibold text-green-600">
                            ₽{item.price.toLocaleString()}
                          </p>
                        </div>
                        {item.cost && (
                          <div>
                            <p className="text-sm text-gray-500">Закупочная</p>
                            <p className="font-medium">₽{item.cost.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      
                      {item.supplier && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <Building2 className="w-4 h-4" />
                          Поставщик: {item.supplier}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleItemStatus(item)}
                        className={item.active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4">
                {search || categoryFilter ? 'Запчасти не найдены' : 'Пока нет добавленных запчастей'}
              </p>
              {!search && !categoryFilter && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первую запчасть
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

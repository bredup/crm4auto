'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number | null
  category: string | null
  active: boolean
}

interface EditServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSuccess: () => void
}

export function EditServiceDialog({ 
  open, 
  onOpenChange, 
  service,
  onSuccess 
}: EditServiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    active: true
  })

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price.toString(),
        duration: service.duration?.toString() || '',
        category: service.category || '',
        active: service.active
      })
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          duration: formData.duration ? parseInt(formData.duration) : null,
          category: formData.category || null,
          active: formData.active
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при обновлении услуги')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      setError('Произошла ошибка при обновлении услуги')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать услугу</DialogTitle>
          <DialogDescription>
            Измените параметры услуги
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                placeholder="ТО, Ремонт, Диагностика..."
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Цена (₽) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Время (мин)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              disabled={isLoading}
              placeholder="Подробное описание услуги..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({...formData, active: e.target.checked})}
              disabled={isLoading}
              className="rounded"
            />
            <Label htmlFor="active">Активная услуга</Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

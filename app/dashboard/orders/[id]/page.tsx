import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, FileText, User, Car, Phone, Calendar, 
  DollarSign, Edit, Clock, MapPin, Mail, Wrench, Package, Plus
} from 'lucide-react'
import Link from 'next/link'

const statusLabels = {
  RECEIVED: 'Принят',
  IN_PROGRESS: 'В работе',
  WAITING_PARTS: 'Ожидает запчасти',
  READY: 'Готов',
  COMPLETED: 'Выдан',
  CANCELLED: 'Отменен'
}

const statusColors = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const priorityLabels = {
  LOW: 'Низкий',
  NORMAL: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный'
}

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

async function getOrder(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      client: true,
      vehicle: true,
      createdBy: {
        select: { id: true, name: true }
      },
      assignedTo: {
        select: { id: true, name: true }
      }
    }
  })

  return order
}

export default async function OrderDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const { id } = await params
  const order = await getOrder(id)
  
  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              {order.orderNumber}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                {statusLabels[order.status as keyof typeof statusLabels]}
              </Badge>
              <Badge className={priorityColors[order.priority as keyof typeof priorityColors]}>
                {priorityLabels[order.priority as keyof typeof priorityLabels]}
              </Badge>
            </div>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Edit className="w-4 h-4 mr-2" />
          Редактировать
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о заказе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Описание работ</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                {order.description}
              </p>
            </div>

            {order.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Заметки</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                  {order.notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Создан</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Создал</p>
                <p className="font-medium">{order.createdBy?.name}</p>
              </div>
              {order.estimatedDate && (
                <div>
                  <p className="text-sm text-gray-500">Планируемая дата</p>
                  <p className="font-medium">
                    {new Date(order.estimatedDate).toLocaleString('ru-RU')}
                  </p>
                </div>
              )}
              {order.completedDate && (
                <div>
                  <p className="text-sm text-gray-500">Дата завершения</p>
                  <p className="font-medium">
                    {new Date(order.completedDate).toLocaleString('ru-RU')}
                  </p>
                </div>
              )}
            </div>

            {(order.estimatedCost || order.finalCost) && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Стоимость</h4>
                <div className="space-y-2">
                  {order.estimatedCost && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Предварительная:</span>
                      <span className="font-medium">₽{order.estimatedCost.toLocaleString()}</span>
                    </div>
                  )}
                  {order.finalCost && (
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Итоговая стоимость:</span>
                      <span className="text-green-600">₽{order.finalCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Информация о клиенте */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Клиент
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-lg">{order.client.name}</h4>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${order.client.phone}`} className="hover:text-blue-600">
                    {order.client.phone}
                  </a>
                </div>
                {order.client.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${order.client.email}`} className="hover:text-blue-600">
                      {order.client.email}
                    </a>
                  </div>
                )}
                {order.client.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{order.client.address}</span>
                  </div>
                )}
                <div className="pt-3">
                  <Link href={`/dashboard/clients/${order.client.id}`}>
                    <Button variant="outline" size="sm">
                      Перейти к клиенту
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Информация об автомобиле */}
          {order.vehicle && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Автомобиль
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {order.vehicle.brand} {order.vehicle.model}
                    </h4>
                    <p className="text-gray-600">Год выпуска: {order.vehicle.year}</p>
                  </div>
                  
                  {order.vehicle.licensePlate && (
                    <div>
                      <p className="text-sm text-gray-500">Гос. номер</p>
                      <p className="font-mono font-medium">{order.vehicle.licensePlate}</p>
                    </div>
                  )}
                  
                  {order.vehicle.color && (
                    <div>
                      <p className="text-sm text-gray-500">Цвет</p>
                      <p>{order.vehicle.color}</p>
                    </div>
                  )}
                  
                  {order.vehicle.mileage && (
                    <div>
                      <p className="text-sm text-gray-500">Пробег</p>
                      <p>{order.vehicle.mileage.toLocaleString()} км</p>
                    </div>
                  )}
                  
                  {order.vehicle.vin && (
                    <div>
                      <p className="text-sm text-gray-500">VIN</p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                        {order.vehicle.vin}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Услуги и запчасти */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Услуги
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Услуги не добавлены</p>
              <p className="text-sm mt-1">Будет реализовано в следующей версии</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Запчасти
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Запчасти не добавлены</p>
              <p className="text-sm mt-1">Будет реализовано в следующей версии</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

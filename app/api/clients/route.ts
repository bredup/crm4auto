import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const withVehicles = searchParams.get('withVehicles') === 'true'

    console.log('🔍 Поиск клиентов:', { search, limit })

    // Если поиск для модального окна записи (короткий запрос)
    if (search && search.length >= 2) {
      const clients = await db.client.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              phone: {
                contains: search.replace(/\D/g, '') // убираем все символы кроме цифр
              }
            },
            {
              email: {
                contains: search
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        },
        take: limit,
        orderBy: {
          name: 'asc'
        }
      })

      console.log(`✅ Найдено клиентов: ${clients.length}`)
      // Возвращаем простой массив для модального окна
      return NextResponse.json(clients)
    }

    // Обычный запрос для списка клиентов (с пагинацией)
    const page = parseInt(searchParams.get('page') || '1')
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    } : {}

    const include: any = {
      vehicles: withVehicles ? {
        select: { 
          id: true, 
          brand: true, 
          model: true, 
          year: true, 
          licensePlate: true 
        }
      } : {
        select: { id: true }
      },
      orders: {
        select: { id: true }
      }
    }

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: withVehicles ? { name: 'asc' } : { createdAt: 'desc' }
      }),
      db.client.count({ where })
    ])

    // Форматируем клиентов для фронтенда
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      notes: client.notes,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      vehiclesCount: client.vehicles.length,
      ordersCount: client.orders.length,
      ...(withVehicles && {
        vehicles: client.vehicles.map((vehicle: any) => ({
          id: vehicle.id,
          make: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          plateNumber: vehicle.licensePlate,
          fullInfo: `${vehicle.brand} ${vehicle.model} ${vehicle.year}${vehicle.licensePlate ? ` (${vehicle.licensePlate})` : ''}`
        }))
      })
    }))

    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('❌ Ошибка поиска клиентов:', error)
    return NextResponse.json(
      { error: 'Ошибка поиска клиентов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, address, notes, vehicle } = body

    if (!name || !phone) {
      return NextResponse.json({ 
        error: 'Name and phone are required' 
      }, { status: 400 })
    }

    console.log('🆕 Создание клиента:', { name, phone, email })

    // Проверяем уникальность телефона
    const existingClient = await db.client.findFirst({
      where: { phone }
    })

    if (existingClient) {
      return NextResponse.json({ 
        error: 'Client with this phone already exists' 
      }, { status: 409 })
    }

    // Создаем клиента
    const client = await db.client.create({
      data: {
        name,
        email: email || null,
        phone,
        address: address || null,
        notes: notes || null
      }
    })

    console.log('✅ Клиент создан:', client)

    // Возвращаем данные в формате, ожидаемом модальным окном
    return NextResponse.json({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Ошибка создания клиента:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

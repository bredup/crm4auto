import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const clientId = searchParams.get('clientId') || ''

    let where: any = {}
    
    // Фильтр по клиенту (ВАЖНО!)
    if (clientId) {
      where.clientId = clientId
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { description: { contains: search } },
        { client: { name: { contains: search } } },
        { vehicle: { 
          OR: [
            { brand: { contains: search } },
            { model: { contains: search } },
            { licensePlate: { contains: search } }
          ]
        }}
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, phone: true }
          },
          vehicle: {
            select: { id: true, brand: true, model: true, licensePlate: true, year: true }
          },
          createdBy: {
            select: { id: true, name: true }
          },
          assignedTo: {
            select: { id: true, name: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, vehicleId, description, priority, estimatedCost, estimatedDate, notes } = body

    if (!clientId || !description) {
      return NextResponse.json({ 
        error: 'Client and description are required' 
      }, { status: 400 })
    }

    const orderCount = await db.order.count()
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

    const order = await db.order.create({
      data: {
        orderNumber,
        clientId,
        vehicleId: vehicleId || null,
        createdById: session.user.id,
        description,
        priority: priority || 'NORMAL',
        status: 'RECEIVED',
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        notes: notes || null
      },
      include: {
        client: {
          select: { name: true, phone: true }
        },
        vehicle: {
          select: { brand: true, model: true, licensePlate: true, year: true }
        },
        createdBy: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const clientId = searchParams.get('clientId')

    let where: any = {}
    
    if (clientId) {
      where.clientId = clientId
    }
    
    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
        { licensePlate: { contains: search } },
        { vin: { contains: search } },
        { client: { name: { contains: search } } }
      ]
    }

    const [vehicles, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, phone: true }
          },
          orders: {
            select: { id: true, status: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.vehicle.count({ where })
    ])

    const vehiclesWithCounts = vehicles.map(vehicle => ({
      ...vehicle,
      ordersCount: vehicle.orders.length,
      activeOrdersCount: vehicle.orders.filter(order => order.status !== 'COMPLETED').length
    }))

    return NextResponse.json({
      vehicles: vehiclesWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
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
    const { clientId, brand, model, year, vin, licensePlate, color, mileage, notes } = body

    if (!clientId || !brand || !model || !year) {
      return NextResponse.json({ 
        error: 'Client, brand, model and year are required' 
      }, { status: 400 })
    }

    const vehicle = await db.vehicle.create({
      data: {
        clientId,
        brand,
        model,
        year: parseInt(year),
        vin: vin || null,
        licensePlate: licensePlate || null,
        color: color || null,
        mileage: mileage ? parseInt(mileage) : null,
        notes: notes || null
      },
      include: {
        client: {
          select: { name: true, phone: true }
        }
      }
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

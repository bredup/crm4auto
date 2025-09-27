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
    const category = searchParams.get('category') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    const active = searchParams.get('active')

    let where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
        { supplier: { contains: search } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (lowStock) {
      // Показать только товары где количество меньше минимального
      where.quantity = { lte: { minQuantity: true } }
    }

    if (active !== null && active !== '') {
      where.active = active === 'true'
    }

    const [items, total] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      db.inventoryItem.count({ where })
    ])

    // Получаем уникальные категории для фильтра
    const categories = await db.inventoryItem.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category']
    })

    // Получаем статистику
    const [totalItems, lowStockItems] = await Promise.all([
      db.inventoryItem.count({ where: { active: true } }),
      db.inventoryItem.count({
        where: {
          active: true,
          quantity: { lte: db.inventoryItem.fields.minQuantity }
        }
      })
    ])

    return NextResponse.json({
      items,
      categories: categories.map(c => c.category).filter(Boolean),
      stats: {
        totalItems,
        lowStockItems
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
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
    const { name, description, sku, price, cost, quantity, minQuantity, category, supplier } = body

    if (!name || !price) {
      return NextResponse.json({ 
        error: 'Name and price are required' 
      }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        name,
        description: description || null,
        sku: sku || null,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        quantity: quantity ? parseInt(quantity) : 0,
        minQuantity: minQuantity ? parseInt(minQuantity) : 0,
        category: category || null,
        supplier: supplier || null,
        active: true
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

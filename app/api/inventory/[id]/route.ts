import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, sku, price, cost, quantity, minQuantity, category, supplier, active } = body

    if (!name || !price) {
      return NextResponse.json({ 
        error: 'Name and price are required' 
      }, { status: 400 })
    }

    // Исправляем на правильное название
    const item = await db.inventoryItem.update({
      where: { id },
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
        active: active !== undefined ? active : true
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const item = await db.inventoryItem.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

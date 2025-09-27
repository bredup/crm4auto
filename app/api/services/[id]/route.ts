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
    const { name, description, price, duration, category, active } = body

    if (!name || !price) {
      return NextResponse.json({ 
        error: 'Name and price are required' 
      }, { status: 400 })
    }

    const service = await db.service.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : null,
        category: category || null,
        active: active !== undefined ? active : true
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
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

    // Проверяем права доступа
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Вместо удаления, деактивируем услугу
    const service = await db.service.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

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
    const { name, email, password, role, active } = body

    // Пользователи могут редактировать только себя, админы - всех
    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Обычные пользователи не могут менять роль и статус
    let updateData: any = { name, email }
    
    if (session.user.role === 'ADMIN') {
      updateData.role = role
      updateData.active = active
    }

    // Если есть новый пароль, хешируем его
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Нельзя удалить самого себя
    if (session.user.id === id) {
      return NextResponse.json({ 
        error: 'Cannot delete yourself' 
      }, { status: 400 })
    }

    // Деактивируем вместо удаления
    const user = await db.user.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

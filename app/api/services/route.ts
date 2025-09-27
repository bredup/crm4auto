import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const whereClause: any = {}
    
    if (category) {
      whereClause.category = category
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }
    
    const services = await db.service.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Ошибка получения услуг:', error)
    return NextResponse.json(
      { error: 'Ошибка получения услуг' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, duration, category } = body

    if (!name || !price || !duration || !category) {
      return NextResponse.json(
        { error: 'Name, price, duration and category are required' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        duration: parseInt(duration),
        category
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания услуги:', error)
    return NextResponse.json(
      { error: 'Ошибка создания услуги' },
      { status: 500 }
    )
  }
}

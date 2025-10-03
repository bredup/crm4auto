import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Этот endpoint создаёт первого пользователя в системе
// Вызовите его один раз: curl -X POST http://localhost:3000/api/users/init

export async function POST() {
  try {
    // Проверяем, есть ли уже пользователи
    const existingUsers = await db.user.findMany();
    
    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Пользователи уже существуют в системе'
      }, { status: 400 });
    }

    // Создаём первого администратора
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await db.user.create({
      data: {
        name: 'Администратор',
        email: 'admin@crm4auto.com',
        password: hashedPassword,
        role: 'ADMIN',
        active: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Первый пользователь создан',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error creating first user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при создании пользователя',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

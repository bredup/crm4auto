import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, clients: [] });
    }

    const clients = await db.client.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } }
        ]
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error('Error searching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка поиска клиентов' }, 
      { status: 500 }
    );
  }
}

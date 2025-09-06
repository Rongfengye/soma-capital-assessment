import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeId = searchParams.get('excludeId');
    
    const todos = await prisma.todo.findMany({
      where: excludeId ? {
        id: {
          not: parseInt(excludeId),
        },
      } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        duration: true,
      },
    });
    
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching available dependencies' }, { status: 500 });
  }
}
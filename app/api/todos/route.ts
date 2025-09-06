import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchPexelsImage } from '@/lib/pexels';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        dependencies: {
          include: {
            dependency: true,
          },
        },
        dependents: {
          include: {
            dependent: true,
          },
        },
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, duration = 1, dependencyIds = [] } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
    }
    
    const imageUrl = await searchPexelsImage(title);
    
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: new Date(dueDate),
        duration,
        imageUrl,
        dependencies: {
          create: dependencyIds.map((depId: number) => ({
            dependencyId: depId,
          })),
        },
      },
      include: {
        dependencies: {
          include: {
            dependency: true,
          },
        },
        dependents: {
          include: {
            dependent: true,
          },
        },
      },
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}
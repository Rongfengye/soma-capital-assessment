import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasCircularDependency } from '@/lib/dependencies';

export async function POST(request: Request) {
  try {
    const { todoId, dependencyIds, dueDate } = await request.json();
    
    if (!dependencyIds || !Array.isArray(dependencyIds)) {
      return NextResponse.json({ error: 'dependencyIds must be an array' }, { status: 400 });
    }
    
    const todos = await prisma.todo.findMany({
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
    
    // Check for circular dependencies
    const hasCircular = hasCircularDependency(todoId || -1, dependencyIds, todos);
    if (hasCircular) {
      return NextResponse.json({ 
        valid: false,
        error: 'Circular dependency detected'
      });
    }
    
    // Check for date order logic (dependencies should be due before the current task)
    if (dueDate && dependencyIds.length > 0) {
      const currentDueDate = new Date(dueDate);
      const dependencyTodos = todos.filter(t => dependencyIds.includes(t.id));
      
      for (const depTodo of dependencyTodos) {
        const depDueDate = new Date(depTodo.dueDate);
        if (depDueDate >= currentDueDate) {
          return NextResponse.json({
            valid: false,
            error: `"${depTodo.title}" is due ${depDueDate.toLocaleDateString()} which is not before this task's due date ${currentDueDate.toLocaleDateString()}`
          });
        }
      }
    }
    
    return NextResponse.json({ 
      valid: true,
      error: null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error validating dependencies' }, { status: 500 });
  }
}
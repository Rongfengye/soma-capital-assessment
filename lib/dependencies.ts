import { Todo, TodoDependency } from '@prisma/client';

type TodoWithDependencies = Todo & {
  dependencies: (TodoDependency & { dependency: Todo })[];
  dependents: (TodoDependency & { dependent: Todo })[];
};

export function hasCircularDependency(
  todoId: number,
  newDependencyIds: number[],
  allTodos: TodoWithDependencies[]
): boolean {
  const todoMap = new Map(allTodos.map(t => [t.id, t]));
  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  function dfs(currentId: number): boolean {
    visited.add(currentId);
    recursionStack.add(currentId);

    const todo = todoMap.get(currentId);
    if (!todo) return false;

    const dependencyIds = currentId === todoId 
      ? newDependencyIds 
      : todo.dependencies.map(d => d.dependencyId);

    for (const depId of dependencyIds) {
      if (!visited.has(depId)) {
        if (dfs(depId)) return true;
      } else if (recursionStack.has(depId)) {
        return true;
      }
    }

    recursionStack.delete(currentId);
    return false;
  }

  return dfs(todoId);
}

export function calculateEarliestStart(
  todo: TodoWithDependencies,
  allTodos: TodoWithDependencies[]
): Date {
  if (todo.dependencies.length === 0) {
    return new Date();
  }

  const todoMap = new Map(allTodos.map(t => [t.id, t]));
  let maxEndDate = new Date(0);

  for (const dep of todo.dependencies) {
    const depTodo = todoMap.get(dep.dependencyId);
    if (depTodo) {
      const depStart = calculateEarliestStart(depTodo, allTodos);
      const depEnd = new Date(depStart);
      depEnd.setDate(depEnd.getDate() + depTodo.duration);
      
      if (depEnd > maxEndDate) {
        maxEndDate = depEnd;
      }
    }
  }

  return maxEndDate;
}

export function calculateCriticalPath(todos: TodoWithDependencies[]): number[] {
  const todoMap = new Map(todos.map(t => [t.id, t]));
  const earliestStart = new Map<number, Date>();
  const earliestFinish = new Map<number, Date>();
  const latestStart = new Map<number, Date>();
  const latestFinish = new Map<number, Date>();
  
  // Calculate earliest start and finish times
  todos.forEach(todo => {
    const start = calculateEarliestStart(todo, todos);
    earliestStart.set(todo.id, start);
    const finish = new Date(start);
    finish.setDate(finish.getDate() + todo.duration);
    earliestFinish.set(todo.id, finish);
  });

  // Find the latest project finish time
  let projectFinish = new Date(0);
  todos.forEach(todo => {
    const finish = earliestFinish.get(todo.id)!;
    if (finish > projectFinish) {
      projectFinish = finish;
    }
  });

  // Calculate latest start and finish times (backward pass)
  function calculateLatestTimes(todoId: number): void {
    const todo = todoMap.get(todoId)!;
    
    if (todo.dependents.length === 0) {
      // No dependents, so latest finish is project finish
      latestFinish.set(todoId, projectFinish);
    } else {
      // Latest finish is minimum of dependents' latest starts
      let minDependentStart = new Date(8640000000000000); // Max date
      
      for (const dep of todo.dependents) {
        if (!latestStart.has(dep.dependentId)) {
          calculateLatestTimes(dep.dependentId);
        }
        const depStart = latestStart.get(dep.dependentId)!;
        if (depStart < minDependentStart) {
          minDependentStart = depStart;
        }
      }
      
      latestFinish.set(todoId, minDependentStart);
    }
    
    const finish = latestFinish.get(todoId)!;
    const start = new Date(finish);
    start.setDate(start.getDate() - todo.duration);
    latestStart.set(todoId, start);
  }

  // Calculate latest times for all todos
  todos.forEach(todo => {
    if (!latestStart.has(todo.id)) {
      calculateLatestTimes(todo.id);
    }
  });

  // Find critical path (where earliest start = latest start)
  const criticalPath: number[] = [];
  todos.forEach(todo => {
    const eStart = earliestStart.get(todo.id)!;
    const lStart = latestStart.get(todo.id)!;
    
    if (Math.abs(eStart.getTime() - lStart.getTime()) < 1000) { // Within 1 second
      criticalPath.push(todo.id);
    }
  });

  return criticalPath;
}

export function getTopologicalSort(todos: TodoWithDependencies[]): number[] {
  const todoMap = new Map(todos.map(t => [t.id, t]));
  const visited = new Set<number>();
  const result: number[] = [];

  function dfs(todoId: number): void {
    visited.add(todoId);
    const todo = todoMap.get(todoId);
    
    if (todo) {
      for (const dep of todo.dependencies) {
        if (!visited.has(dep.dependencyId)) {
          dfs(dep.dependencyId);
        }
      }
    }
    
    result.push(todoId);
  }

  todos.forEach(todo => {
    if (!visited.has(todo.id)) {
      dfs(todo.id);
    }
  });

  return result;
}
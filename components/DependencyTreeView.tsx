"use client"
import { useState } from 'react';
import { getTopologicalSort } from '@/lib/dependencies';

interface Todo {
  id: number;
  title: string;
  dueDate: string;
  duration: number;
  dependencies: { dependency: { id: number; title: string } }[];
  dependents: { dependent: { id: number; title: string } }[];
}

interface DependencyTreeViewProps {
  todos: Todo[];
  criticalPath: number[];
}

export default function DependencyTreeView({ todos, criticalPath }: DependencyTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (todos.length === 0) {
    return null;
  }

  const sortedTodos = getTopologicalSort(todos);
  const todoMap = new Map(todos.map(t => [t.id, t]));

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getIndentLevel = (todoId: number, visited = new Set()): number => {
    if (visited.has(todoId)) return 0;
    visited.add(todoId);
    
    const todo = todoMap.get(todoId);
    if (!todo || todo.dependencies.length === 0) return 0;
    
    let maxDepth = 0;
    for (const dep of todo.dependencies) {
      const depth = getIndentLevel(dep.dependency.id, visited);
      maxDepth = Math.max(maxDepth, depth + 1);
    }
    
    return maxDepth;
  };

  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800">Dependency Tree View</span>
        <svg 
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="space-y-2 mt-4">
            {sortedTodos.map((todoId, index) => {
              const todo = todoMap.get(todoId);
              if (!todo) return null;
              
              const indentLevel = getIndentLevel(todoId);
              const isOnCriticalPath = criticalPath.includes(todoId);
              
              return (
                <div key={todoId} className="relative">
                  {/* Connection lines */}
                  {indentLevel > 0 && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-300"
                      style={{ marginLeft: `${(indentLevel - 1) * 24 + 12}px` }}
                    />
                  )}
                  {indentLevel > 0 && (
                    <div 
                      className="absolute top-6 border-t-2 border-gray-300"
                      style={{ 
                        left: `${(indentLevel - 1) * 24 + 12}px`,
                        width: '24px'
                      }}
                    />
                  )}
                  
                  {/* Todo item */}
                  <div 
                    className={`flex items-center p-3 rounded-lg border-l-4 ${
                      isOnCriticalPath 
                        ? 'border-l-orange-500 bg-orange-50' 
                        : 'border-l-gray-300 bg-gray-50'
                    }`}
                    style={{ marginLeft: `${indentLevel * 24}px` }}
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isOnCriticalPath ? 'text-orange-700' : 'text-gray-800'}`}>
                          {todo.title}
                        </span>
                        {isOnCriticalPath && (
                          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                            Critical
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        Due: {formatDate(todo.dueDate)} • {todo.duration} day{todo.duration !== 1 ? 's' : ''}
                      </div>
                      
                      {todo.dependencies.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          ↳ Depends on: {todo.dependencies.map(d => d.dependency.title).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {criticalPath.length > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-1">
                Critical Path ({criticalPath.length} tasks)
              </div>
              <div className="text-xs text-orange-700">
                These tasks cannot be delayed without affecting the project completion date.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
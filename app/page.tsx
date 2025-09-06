"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';
import DependencySelector from '@/components/DependencySelector';
import DependencyTreeView from '@/components/DependencyTreeView';
import { calculateEarliestStart, calculateCriticalPath } from '@/lib/dependencies';

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [dependencies, setDependencies] = useState<number[]>([]);
  const [todos, setTodos] = useState([]);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [criticalPath, setCriticalPath] = useState<number[]>([]);
  const [isDependencyValid, setIsDependencyValid] = useState(true);
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    return dueDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const isOverdue = (date: string) => {
    const dueDate = new Date(date);
    const now = new Date();
    return dueDate < now;
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
      
      if (data.length > 0) {
        const criticalPathIds = calculateCriticalPath(data);
        setCriticalPath(criticalPathIds);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const getEarliestStartDate = (todo: any) => {
    try {
      return calculateEarliestStart(todo, todos);
    } catch {
      return new Date();
    }
  };

  const toggleExpansion = (todoId: number) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
    }
    setExpandedTodos(newExpanded);
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !dueDate || !isDependencyValid) return;
    setIsAddingTodo(true);
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTodo, 
          dueDate, 
          duration,
          dependencyIds: dependencies
        }),
      });
      setNewTodo('');
      setDueDate('');
      setDuration(1);
      setDependencies([]);
      setIsDependencyValid(true);
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleDeleteTodo = async (id:any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                className="w-full p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 border border-gray-300"
                placeholder="Add a new todo"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 border border-gray-300"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 border border-gray-300"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            <DependencySelector
              selectedDependencies={dependencies}
              onDependenciesChange={setDependencies}
              dueDate={dueDate}
              onValidationChange={setIsDependencyValid}
            />
            
            <button
              onClick={handleAddTodo}
              disabled={isAddingTodo || !isDependencyValid || !newTodo.trim() || !dueDate}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full hover:from-orange-600 hover:to-red-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isAddingTodo ? 'Adding...' : 
               !isDependencyValid ? 'Fix Dependencies to Continue' :
               !newTodo.trim() || !dueDate ? 'Fill Required Fields' :
               'Add Todo'}
            </button>
          </div>
        </div>
        
        <DependencyTreeView todos={todos} criticalPath={criticalPath} />
        
        <ul>
          {todos.map((todo:Todo) => (
            <li
              key={todo.id}
              className={`bg-white bg-opacity-90 rounded-lg shadow-lg mb-4 overflow-hidden ${
                isOverdue(todo.dueDate) ? 'border-l-4 border-l-red-500 bg-red-50' : ''
              }`}
            >
              {/* Main Card Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Image */}
                  <div className="w-[100px] h-[100px] flex-shrink-0">
                    {todo.imageUrl ? (
                      <img 
                        src={todo.imageUrl} 
                        alt={todo.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                        no image found
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        {/* Title and badges */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-gray-800 font-medium text-lg">{todo.title}</h3>
                          {criticalPath.includes(todo.id) && (
                            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                              Critical
                            </span>
                          )}
                        </div>
                        
                        {/* Due date */}
                        <div className={`text-sm mb-2 ${isOverdue(todo.dueDate) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          📅 Due: {formatDueDate(todo.dueDate)} • ⏱️ {todo.duration} day{todo.duration !== 1 ? 's' : ''}
                          {isOverdue(todo.dueDate) && <span className="ml-2 text-red-500">⚠️ OVERDUE</span>}
                        </div>
                        
                        {/* Dependencies summary */}
                        {todo.dependencies && todo.dependencies.length > 0 && (
                          <button
                            onClick={() => toggleExpansion(todo.id)}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                              {todo.dependencies.length} dependenc{todo.dependencies.length !== 1 ? 'ies' : 'y'}
                            </span>
                            <span>
                              {expandedTodos.has(todo.id) ? '▼ Hide details' : '▶ Show details'}
                            </span>
                          </button>
                        )}
                        
                        {todo.dependencies && todo.dependencies.length === 0 && (
                          <span className="text-sm text-green-600">✅ Ready to start</span>
                        )}
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-700 transition duration-300 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expandable Dependencies Section */}
              {expandedTodos.has(todo.id) && todo.dependencies && todo.dependencies.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 bg-opacity-50 p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    📋 Dependency Details
                    {todo.dependencies.length > 0 && (
                      <span className="text-blue-600">
                        Earliest start: {formatDueDate(getEarliestStartDate(todo).toISOString())}
                      </span>
                    )}
                  </h4>
                  
                  <div className="space-y-2">
                    {todo.dependencies.map((dep: any, index: number) => (
                      <div key={dep.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 font-mono">{index + 1}</span>
                        <div className="flex-grow">
                          <div className="font-medium text-gray-800">{dep.dependency.title}</div>
                          <div className="text-xs text-gray-500">
                            Due: {formatDueDate(dep.dependency.dueDate)} • {dep.dependency.duration} day{dep.dependency.duration !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-xs">
                          {isOverdue(dep.dependency.dueDate) ? (
                            <span className="text-red-500 font-semibold">⚠️ Overdue</span>
                          ) : (
                            <span className="text-green-600">✅ On track</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Flow visualization for this task */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-blue-800 mb-2">Task Flow:</div>
                    <div className="flex items-center gap-2 text-xs overflow-x-auto">
                      {todo.dependencies.map((dep: any, index: number) => (
                        <div key={dep.id} className="flex items-center gap-1 flex-shrink-0">
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                            {dep.dependency.title}
                          </span>
                          {index < todo.dependencies.length - 1 && <span className="text-blue-400">→</span>}
                        </div>
                      ))}
                      <span className="text-blue-400">→</span>
                      <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded font-medium">
                        {todo.title}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

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
              className={`flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg ${
                isOverdue(todo.dueDate) ? 'border-l-4 border-l-red-500 bg-red-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-[130px] h-[130px] flex-shrink-0">
                  {todo.imageUrl ? (
                    <img 
                      src={todo.imageUrl} 
                      alt={todo.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                      no image found
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-800 font-medium">{todo.title}</span>
                    {criticalPath.includes(todo.id) && (
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Critical Path
                      </span>
                    )}
                    {todo.dependencies && todo.dependencies.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {todo.dependencies.length} dep{todo.dependencies.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className={`${isOverdue(todo.dueDate) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                      Due: {formatDueDate(todo.dueDate)} • {todo.duration} day{todo.duration !== 1 ? 's' : ''}
                      {isOverdue(todo.dueDate) && <span className="ml-2 text-red-500">⚠️ OVERDUE</span>}
                    </div>
                    
                    {todo.dependencies && todo.dependencies.length > 0 && (
                      <div className="text-blue-600">
                        Earliest start: {formatDueDate(getEarliestStartDate(todo).toISOString())}
                      </div>
                    )}
                    
                    {todo.dependencies && todo.dependencies.length > 0 && (
                      <div className="text-gray-500 text-xs">
                        Depends on: {todo.dependencies.map((dep: any) => dep.dependency.title).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700 transition duration-300 ml-4"
              >
                {/* Delete Icon */}
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

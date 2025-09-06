"use client"
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  title: string;
  dueDate: string;
  duration: number;
}

interface DependencySelectorProps {
  selectedDependencies: number[];
  onDependenciesChange: (dependencies: number[]) => void;
  currentTodoId?: number;
  dueDate?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export default function DependencySelector({ 
  selectedDependencies, 
  onDependenciesChange, 
  currentTodoId,
  dueDate,
  onValidationChange
}: DependencySelectorProps) {
  const [availableTodos, setAvailableTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    fetchAvailableTodos();
  }, [currentTodoId]);

  useEffect(() => {
    if (selectedDependencies.length > 0 && dueDate) {
      validateDependencies();
    } else {
      setValidationError(null);
      onValidationChange?.(true); // No dependencies = valid
    }
  }, [selectedDependencies, dueDate]);

  const fetchAvailableTodos = async () => {
    try {
      const excludeParam = currentTodoId ? `?excludeId=${currentTodoId}` : '';
      const response = await fetch(`/api/todos/available-dependencies${excludeParam}`);
      const todos = await response.json();
      setAvailableTodos(todos);
    } catch (error) {
      console.error('Failed to fetch available todos:', error);
    }
  };

  const validateDependencies = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/todos/validate-dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todoId: currentTodoId,
          dependencyIds: selectedDependencies,
          dueDate: dueDate,
        }),
      });
      const result = await response.json();
      setValidationError(result.valid ? null : result.error);
      onValidationChange?.(result.valid);
    } catch (error) {
      console.error('Failed to validate dependencies:', error);
      setValidationError('Failed to validate dependencies');
      onValidationChange?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  const filteredTodos = availableTodos.filter(todo =>
    todo.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedDependencies.includes(todo.id)
  );

  const selectedTodos = availableTodos.filter(todo =>
    selectedDependencies.includes(todo.id)
  );

  const addDependency = (todoId: number) => {
    onDependenciesChange([...selectedDependencies, todoId]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const removeDependency = (todoId: number) => {
    onDependenciesChange(selectedDependencies.filter(id => id !== todoId));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Dependencies
      </label>
      
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          className="w-full p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
          placeholder="Search tasks to add as dependencies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />
        
        {/* Search Suggestions */}
        {showSuggestions && searchQuery && filteredTodos.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
            {filteredTodos.slice(0, 5).map((todo) => (
              <button
                key={todo.id}
                className="w-full p-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                onClick={() => addDependency(todo.id)}
              >
                <div className="font-medium text-gray-800">{todo.title}</div>
                <div className="text-sm text-gray-500">
                  Due: {formatDate(todo.dueDate)} • {todo.duration} day{todo.duration !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Dependencies */}
      {selectedTodos.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Selected Dependencies:</div>
          {selectedTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-800">{todo.title}</div>
                <div className="text-sm text-gray-500">
                  Due: {formatDate(todo.dueDate)} • {todo.duration} day{todo.duration !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => removeDependency(todo.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
          {validationError}
        </div>
      )}

      {/* Validation Loading */}
      {isValidating && (
        <div className="text-gray-500 text-sm">
          Validating dependencies...
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [todos, setTodos] = useState([]);
  const [isAddingTodo, setIsAddingTodo] = useState(false);

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
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !dueDate) return;
    setIsAddingTodo(true);
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo, dueDate }),
      });
      setNewTodo('');
      setDueDate('');
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
        <div className="flex mb-6 gap-2">
          <input
            type="text"
            className="flex-grow p-3 rounded-full focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            className="p-3 rounded-full focus:outline-none text-gray-700"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <button
            onClick={handleAddTodo}
            disabled={isAddingTodo}
            className="bg-white text-indigo-600 p-3 px-6 rounded-full hover:bg-gray-100 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingTodo ? 'Adding...' : 'Add'}
          </button>
        </div>
        <ul>
          {todos.map((todo:Todo) => (
            <li
              key={todo.id}
              className="flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
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
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium">{todo.title}</span>
                  <span className={`text-sm ${isOverdue(todo.dueDate) ? 'text-red-500' : 'text-gray-600'}`}>
                    Due: {formatDueDate(todo.dueDate)}
                  </span>
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

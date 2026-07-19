import React from 'react';

// SSR function to fetch todos
async function getTodos() {
  const res = await fetch('http://localhost:4000/api/todos', {
    // We can use Next.js fetch caching options here
    cache: 'no-store',
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch todos');
  }
  
  return res.json();
}

export default async function TodosPage() {
  const todos = await getTodos();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Todos (SSR)</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {todos.length === 0 ? (
          <p className="text-gray-500">No todos found.</p>
        ) : (
          <ul className="space-y-4">
            {todos.map((todo: any) => (
              <li key={todo.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={todo.completed} 
                    readOnly 
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  <span className={todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}>
                    {todo.title}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(todo.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

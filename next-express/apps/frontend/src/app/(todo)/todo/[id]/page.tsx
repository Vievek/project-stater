import React from 'react';
import { getTodoByIdAction } from '@/modules/todo';
import { TodoForm } from '@/modules/todo';
import { notFound } from 'next/navigation';

export default async function EditTodoPage({ params }: { params: { id: string } }) {
  try {
    const todo = await getTodoByIdAction(params.id);
    
    if (!todo) {
      notFound();
    }

    return (
      <div className="p-8">
        <TodoForm initialData={todo} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
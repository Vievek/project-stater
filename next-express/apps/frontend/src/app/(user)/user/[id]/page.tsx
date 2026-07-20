import React from 'react';
import { getUserByIdAction } from '@/modules/user';
import { UserForm } from '@/modules/user';
import { notFound } from 'next/navigation';

export default async function EditUserPage({ params }: { params: { id: string } }) {
  try {
    const user = await getUserByIdAction(params.id);
    
    if (!user) {
      notFound();
    }

    return (
      <div className="p-8">
        <UserForm initialData={user} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
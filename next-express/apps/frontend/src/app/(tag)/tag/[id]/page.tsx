import React from 'react';
import { getTagByIdAction } from '@/modules/tag';
import { TagForm } from '@/modules/tag';
import { notFound } from 'next/navigation';

export default async function EditTagPage({ params }: { params: { id: string } }) {
  try {
    const tag = await getTagByIdAction(params.id);
    
    if (!tag) {
      notFound();
    }

    return (
      <div className="p-8">
        <TagForm initialData={tag} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
import React from 'react';
import { getCategoryByIdAction } from '@/modules/category';
import { CategoryForm } from '@/modules/category';
import { notFound } from 'next/navigation';

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  try {
    const category = await getCategoryByIdAction(params.id);
    
    if (!category) {
      notFound();
    }

    return (
      <div className="p-8">
        <CategoryForm initialData={category} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
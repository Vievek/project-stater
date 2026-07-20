import React from 'react';
import { getCategorysAction } from '@/modules/category';
import { CategoryTable } from '@/modules/category';

export default async function CategorysPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Pass search params to action for server-side filtering/pagination
  const data = await getCategorysAction(searchParams);
  
  // Example hardcoded pagination props, normally you'd get these from the API response
  const pageCount = 1; 
  const totalItems = data.length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <CategoryTable data={data} pageCount={pageCount} totalItems={totalItems} />
    </div>
  );
}
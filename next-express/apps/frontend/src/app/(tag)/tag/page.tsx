import React from 'react';
import { getTagsAction } from '@/modules/tag';
import { TagTable } from '@/modules/tag';

export default async function TagsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Pass search params to action for server-side filtering/pagination
  const data = await getTagsAction(searchParams);
  
  // Example hardcoded pagination props, normally you'd get these from the API response
  const pageCount = 1; 
  const totalItems = data.length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <TagTable data={data} pageCount={pageCount} totalItems={totalItems} />
    </div>
  );
}
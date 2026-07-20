import React from 'react';
import { getUsersAction } from '@/modules/user';
import { UserTable } from '@/modules/user';

export default async function UsersPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Pass search params to action for server-side filtering/pagination
  const data = await getUsersAction(searchParams);
  
  // Example hardcoded pagination props, normally you'd get these from the API response
  const pageCount = 1; 
  const totalItems = data.length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <UserTable data={data} pageCount={pageCount} totalItems={totalItems} />
    </div>
  );
}
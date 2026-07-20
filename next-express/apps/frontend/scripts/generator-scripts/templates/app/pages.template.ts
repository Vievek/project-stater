import { Manifest } from '../../generate-modules';

export function generateAppListPageTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
import React from 'react';
import { get${modelName}sAction } from '@/modules/${moduleName}';
import { ${modelName}Table } from '@/modules/${moduleName}';

export default async function ${modelName}sPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Pass search params to action for server-side filtering/pagination
  const data = await get${modelName}sAction(searchParams);
  
  // Example hardcoded pagination props, normally you'd get these from the API response
  const pageCount = 1; 
  const totalItems = data.length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <${modelName}Table data={data} pageCount={pageCount} totalItems={totalItems} />
    </div>
  );
}
`.trim();
}

export function generateAppNewPageTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
import React from 'react';
import { ${modelName}Form } from '@/modules/${moduleName}';

export default function New${modelName}Page() {
  return (
    <div className="p-8">
      <${modelName}Form />
    </div>
  );
}
`.trim();
}

export function generateAppEditPageTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
import React from 'react';
import { get${modelName}ByIdAction } from '@/modules/${moduleName}';
import { ${modelName}Form } from '@/modules/${moduleName}';
import { notFound } from 'next/navigation';

export default async function Edit${modelName}Page({ params }: { params: { id: string } }) {
  try {
    const ${moduleName} = await get${modelName}ByIdAction(params.id);
    
    if (!${moduleName}) {
      notFound();
    }

    return (
      <div className="p-8">
        <${modelName}Form initialData={${moduleName}} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
`.trim();
}

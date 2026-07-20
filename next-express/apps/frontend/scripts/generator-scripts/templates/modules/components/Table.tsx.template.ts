import { Manifest } from '../../../generate-modules';

export function generateTableTemplate(manifest: Manifest): string {
  const { moduleName, modelName, queryConfig } = manifest;
  
  const sortableFields = queryConfig.sortableFields || ['id'];
  const searchableColumn = queryConfig.searchableFields?.[0] || sortableFields[0] || 'id';

  const columnsConfig = sortableFields.map((field: string) => {
    return `  {
    accessorKey: "${field}",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ${field.charAt(0).toUpperCase() + field.slice(1)}
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },`;
  }).join('\n');

  return `
"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DynamicTable } from "@/components/shared/DynamicTable";
import { ${modelName} } from "../types/${moduleName}.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { ArrowUpDown, MoreHorizontal } from "lucide-react";

interface ${modelName}TableProps {
  data: ${modelName}[];
  pageCount: number;
  totalItems: number;
}

export function ${modelName}Table({ data, pageCount, totalItems }: ${modelName}TableProps) {
  
  const columns: ColumnDef<${modelName}>[] = [
${columnsConfig}
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Link href={\`/${moduleName}/\${item.id}\`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        )
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">${modelName}s</h1>
        <Link href={\`/${moduleName}/new\`}>
          <Button>Create New</Button>
        </Link>
      </div>
      <DynamicTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        totalItems={totalItems}
        searchableColumn="${searchableColumn}"
        searchPlaceholder="Search ${modelName}s..."
      />
    </div>
  );
}
`.trim();
}

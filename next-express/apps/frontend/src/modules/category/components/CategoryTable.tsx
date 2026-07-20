"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DynamicTable } from "@/components/shared/DynamicTable";
import { Category } from "../types/category.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { ArrowUpDown, MoreHorizontal } from "lucide-react";

interface CategoryTableProps {
  data: Category[];
  pageCount: number;
  totalItems: number;
}

export function CategoryTable({ data, pageCount, totalItems }: CategoryTableProps) {
  
  const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Id
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          CreatedAt
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          UpdatedAt
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Link href={`/category/${item.id}`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        )
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Categorys</h1>
        <Link href={`/category/new`}>
          <Button>Create New</Button>
        </Link>
      </div>
      <DynamicTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        totalItems={totalItems}
        searchableColumn="id"
        searchPlaceholder="Search Categorys..."
      />
    </div>
  );
}
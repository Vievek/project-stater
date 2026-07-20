"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DynamicTable } from "@/components/shared/DynamicTable";
import { Todo } from "../types/todo.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { ArrowUpDown, MoreHorizontal } from "lucide-react";

interface TodoTableProps {
  data: Todo[];
  pageCount: number;
  totalItems: number;
}

export function TodoTable({ data, pageCount, totalItems }: TodoTableProps) {
  
  const columns: ColumnDef<Todo>[] = [
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
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
  {
    accessorKey: "completed",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Completed
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
  {
    accessorKey: "userId",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          UserId
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
          <Link href={`/todo/${item.id}`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        )
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Todos</h1>
        <Link href={`/todo/new`}>
          <Button>Create New</Button>
        </Link>
      </div>
      <DynamicTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        totalItems={totalItems}
        searchableColumn="id"
        searchPlaceholder="Search Todos..."
      />
    </div>
  );
}
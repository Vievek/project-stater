"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DynamicTable } from "@/components/shared/DynamicTable";
import { User } from "../types/user.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { ArrowUpDown, MoreHorizontal } from "lucide-react";

interface UserTableProps {
  data: User[];
  pageCount: number;
  totalItems: number;
}

export function UserTable({ data, pageCount, totalItems }: UserTableProps) {
  
  const columns: ColumnDef<User>[] = [
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
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
  {
    accessorKey: "password",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Password
          {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
        </Button>
      )
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
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
          <Link href={`/user/${item.id}`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        )
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href={`/user/new`}>
          <Button>Create New</Button>
        </Link>
      </div>
      <DynamicTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        totalItems={totalItems}
        searchableColumn="id"
        searchPlaceholder="Search Users..."
      />
    </div>
  );
}
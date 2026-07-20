"use client";

import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  totalItems: number;
  searchableColumn?: string;
  searchPlaceholder?: string;
}

export function DynamicTable<TData, TValue>({
  columns,
  data,
  pageCount,
  totalItems,
  searchableColumn,
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial states from URL
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialPageSize = Number(searchParams.get("pageSize")) || 10;
  
  // Sorting parsing logic from URL could be added here
  const initialSorting: SortingState = [];

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPage - 1, // react-table is 0-indexed
    pageSize: initialPageSize,
  });

  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  // Search state
  const initialSearch = searchParams.get(`filters[0][value]`) || "";
  const [searchValue, setSearchValue] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchValue, 500);

  // Update URL whenever pagination or sorting changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Update Pagination
    params.set("page", (pagination.pageIndex + 1).toString());
    params.set("pageSize", pagination.pageSize.toString());

    // Update Sorting
    if (sorting.length > 0) {
      params.set("sort[0][field]", sorting[0].id);
      params.set("sort[0][order]", sorting[0].desc ? "desc" : "asc");
    } else {
      params.delete("sort[0][field]");
      params.delete("sort[0][order]");
    }

    // Update Search Filter
    if (debouncedSearch && searchableColumn) {
      params.set("filters[0][field]", searchableColumn);
      params.set("filters[0][operator]", "contains");
      params.set("filters[0][value]", debouncedSearch);
      // Reset to page 1 on new search
      params.set("page", "1");
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      params.delete("filters[0][field]");
      params.delete("filters[0][operator]");
      params.delete("filters[0][value]");
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [pagination, sorting, debouncedSearch, searchableColumn, pathname, router, searchParams]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <div className="space-y-4">
      {searchableColumn && (
        <div className="flex items-center">
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {totalItems} items
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

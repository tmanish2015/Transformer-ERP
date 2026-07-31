import { useState } from 'react'
import type { ColumnDef, SortingState, Table as TanstackTable } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeletonRows } from '@/components/data-table/table-skeleton'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { cn } from '@/lib/utils'

// Columns with no meaningful label on their own (row-select thumbnails, the trailing
// row-menu button) are never useful as a "Label: value" line in the mobile card view —
// they're either shown elsewhere on the card or dropped.
const NON_STACKING_COLUMN_IDS = new Set(['image', 'actions'])

function humanizeColumnId(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  toolbar?: (table: TanstackTable<TData>) => React.ReactNode
  emptyState?: React.ReactNode
  pageSize?: number
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  toolbar,
  emptyState,
  pageSize = 10,
  globalFilter,
  onGlobalFilterChange,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })

  const filterValue = globalFilter ?? internalGlobalFilter
  const setFilterValue = onGlobalFilterChange ?? setInternalGlobalFilter

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: filterValue,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilterValue,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {toolbar && <div className="border-b border-border p-3">{toolbar(table)}</div>}

      {/* Tablet and up: the full table, horizontally scrollable if it's still wider than the viewport. */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={columns.length} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} onClick={() => onRowClick?.(row.original)} className={cn(onRowClick && 'cursor-pointer')}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Phone widths: one card per row instead of a cramped, sideways-scrolling table. */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          emptyState
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => {
              const cells = row.getVisibleCells()
              const actionsCell = cells.find((cell) => cell.column.id === 'actions')
              const contentCells = cells.filter((cell) => !NON_STACKING_COLUMN_IDS.has(cell.column.id))
              const [titleCell, ...restCells] = contentCells

              return (
                <div key={row.id} onClick={() => onRowClick?.(row.original)} className={cn('relative p-4', onRowClick && 'cursor-pointer active:bg-muted/50')}>
                  {actionsCell && (
                    <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                      {flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
                    </div>
                  )}
                  {titleCell && <div className="pr-8 text-sm font-medium text-foreground">{flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}</div>}
                  {restCells.length > 0 && (
                    <dl className="mt-2 space-y-1.5">
                      {restCells.map((cell) => (
                        <div key={cell.id} className="flex items-center justify-between gap-3 text-sm">
                          <dt className="shrink-0 text-xs text-muted-foreground">{humanizeColumnId(cell.column.id)}</dt>
                          <dd className="min-w-0 text-right text-foreground">{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!isLoading && rows.length > 0 && <DataTablePagination table={table} totalRows={table.getFilteredRowModel().rows.length} />}
    </div>
  )
}

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { History } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMovements } from '@/features/inventory/hooks/use-stock'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import { MOVEMENT_TYPE_LABELS } from '@/features/inventory/types/inventory-types'
import type { MovementRow } from '@/features/inventory/api/stock-api'
import { cn } from '@/lib/utils'

export function MovementsPage() {
  const { data, isLoading } = useMovements()
  const { data: warehouses } = useWarehouses()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')

  const filtered = useMemo(() => {
    return (data ?? []).filter((m) => {
      if (typeFilter !== 'all' && m.movement_type !== typeFilter) return false
      if (warehouseFilter !== 'all' && m.warehouse.id !== warehouseFilter) return false
      return true
    })
  }, [data, typeFilter, warehouseFilter])

  const columns: ColumnDef<MovementRow>[] = [
    {
      id: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      accessorFn: (row) => row.created_at,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
    },
    {
      id: 'product',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      accessorFn: (row) => row.product.name,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.product.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.product.sku}</p>
        </div>
      ),
    },
    { id: 'warehouse', header: 'Warehouse', cell: ({ row }) => row.original.warehouse.name },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.movement_type} label={MOVEMENT_TYPE_LABELS[row.original.movement_type] ?? row.original.movement_type} />,
    },
    {
      id: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
      accessorFn: (row) => row.quantity,
      cell: ({ row }) => (
        <span className={cn('font-medium', row.original.quantity >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
          {row.original.quantity >= 0 ? '+' : ''}
          {row.original.quantity} {row.original.product.unit.short_code}
        </span>
      ),
    },
    { id: 'batch', header: 'Batch', cell: ({ row }) => row.original.batch?.batch_number ?? <span className="text-muted-foreground">—</span> },
    { id: 'notes', header: 'Notes', cell: ({ row }) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{row.original.notes ?? '—'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Movement History" description="Full ledger of every stock movement across your warehouses." />

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        pageSize={25}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search movements..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={warehouseFilter} onValueChange={(value) => setWarehouseFilter(value ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={History} title="No movements yet" description="Stock movements will appear here as they happen." />}
      />
    </div>
  )
}

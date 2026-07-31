import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Boxes, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStockLevels } from '@/features/inventory/hooks/use-stock'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import { StockAdjustmentDialog } from '@/features/inventory/components/stock-adjustment-dialog'
import { getStockStatus } from '@/features/inventory/types/inventory-types'
import type { StockLevelRow } from '@/features/inventory/api/stock-api'
import { useAuth } from '@/providers/auth-provider'

const STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

export function StockLevelsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('inventory.manage')

  const { data, isLoading } = useStockLevels()
  const { data: warehouses } = useWarehouses()
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [adjustOpen, setAdjustOpen] = useState(false)

  const totalStockByProduct = useMemo(() => {
    const totals = new Map<string, number>()
    for (const row of data ?? []) {
      totals.set(row.product_id, (totals.get(row.product_id) ?? 0) + Number(row.quantity))
    }
    return totals
  }, [data])

  const filtered = useMemo(() => {
    return (data ?? []).filter((row) => (warehouseFilter === 'all' ? true : row.warehouse_id === warehouseFilter))
  }, [data, warehouseFilter])

  const columns: ColumnDef<StockLevelRow>[] = [
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
      id: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
      accessorFn: (row) => row.quantity,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.quantity} {row.original.product.unit.short_code}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const totalStock = totalStockByProduct.get(row.original.product_id) ?? row.original.quantity
        const status = getStockStatus(totalStock, row.original.product.reorder_level)
        return <StatusBadge status={status} label={STATUS_LABELS[status]} />
      },
    },
    {
      id: 'updated_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
      accessorFn: (row) => row.updated_at,
      cell: ({ row }) => new Date(row.original.updated_at).toLocaleString(),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Levels"
        description="Current stock across all warehouses."
        actions={
          canManage && (
            <Button onClick={() => setAdjustOpen(true)}>
              <Plus /> Record Movement
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
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
        emptyState={<EmptyState icon={Boxes} title="No stock recorded" description="Stock levels will appear here once movements are recorded." />}
      />

      <StockAdjustmentDialog open={adjustOpen} onOpenChange={setAdjustOpen} />
    </div>
  )
}

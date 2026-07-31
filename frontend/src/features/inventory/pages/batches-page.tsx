import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Layers, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBatches } from '@/features/inventory/hooks/use-stock'
import { BatchFormDialog } from '@/features/inventory/components/batch-form-dialog'
import type { BatchRow } from '@/features/inventory/api/stock-api'
import { useAuth } from '@/providers/auth-provider'

function getBatchStatus(expiryDate: string | null): { status: string; label: string } | null {
  if (!expiryDate) return null
  const daysUntil = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return { status: 'expired', label: 'Expired' }
  if (daysUntil <= 60) return { status: 'expiring_soon', label: `Expires in ${daysUntil}d` }
  return { status: 'active', label: 'Good' }
}

export function BatchesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('inventory.manage')
  const { data, isLoading } = useBatches()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const columns: ColumnDef<BatchRow>[] = [
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
    { accessorKey: 'batch_number', header: ({ column }) => <DataTableColumnHeader column={column} title="Batch #" /> },
    { accessorKey: 'manufacture_date', header: 'Manufactured', cell: ({ row }) => (row.original.manufacture_date ? new Date(row.original.manufacture_date).toLocaleDateString() : '—') },
    {
      accessorKey: 'expiry_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry" />,
      cell: ({ row }) => (row.original.expiry_date ? new Date(row.original.expiry_date).toLocaleDateString() : '—'),
    },
    { accessorKey: 'quantity', header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" /> },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getBatchStatus(row.original.expiry_date)
        return status ? <StatusBadge status={status.status} label={status.label} /> : <span className="text-muted-foreground">—</span>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Management"
        description="Track batches, manufacture dates, and expiry for batch-controlled products."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Add Batch
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search batches..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Layers} title="No batches yet" description="Create a batch for a batch-tracked product to start monitoring expiry." />}
      />

      <BatchFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}

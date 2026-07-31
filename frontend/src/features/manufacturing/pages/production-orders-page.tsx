import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Factory, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProductionOrders } from '@/features/manufacturing/hooks/use-production-orders'
import { ProductionOrderFormDialog } from '@/features/manufacturing/components/production-order-form-dialog'
import { PRODUCTION_ORDER_STATUS_LABELS, type ProductionOrderWithRelations } from '@/features/manufacturing/types/manufacturing-types'
import { useAuth } from '@/providers/auth-provider'

export function ProductionOrdersPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manufacturing.manage')
  const navigate = useNavigate()

  const { data: orders, isLoading } = useProductionOrders()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const columns: ColumnDef<ProductionOrderWithRelations>[] = [
    {
      id: 'order_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order #" />,
      accessorFn: (row) => row.order_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => navigate(`/manufacturing/orders/${row.original.id}`)}>
          {row.original.order_number}
        </button>
      ),
    },
    { id: 'product', header: 'Product', cell: ({ row }) => row.original.product.name },
    { id: 'warehouse', header: 'Warehouse', cell: ({ row }) => row.original.warehouse.name },
    { accessorKey: 'quantity', header: 'Quantity' },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={PRODUCTION_ORDER_STATUS_LABELS[row.original.status as keyof typeof PRODUCTION_ORDER_STATUS_LABELS]} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Orders"
        description="Orders raised from a BOM to build finished transformers."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Order
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={orders ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={(row) => navigate(`/manufacturing/orders/${row.id}`)}
        toolbar={() => <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Factory} title="No production orders yet" description="Raise an order from a BOM to start production." />}
      />

      <ProductionOrderFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}

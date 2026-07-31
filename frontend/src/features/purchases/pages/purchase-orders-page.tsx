import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { FileText, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDeletePurchaseOrder, usePurchaseOrders } from '@/features/purchases/hooks/use-purchase-orders'
import { PurchaseOrderFormDrawer } from '@/features/purchases/components/purchase-order-form-drawer'
import { PurchaseOrderDetailSheet } from '@/features/purchases/components/purchase-order-detail-sheet'
import { PO_STATUS_LABELS, type PurchaseOrderWithRelations } from '@/features/purchases/types/purchase-types'
import { useAuth } from '@/providers/auth-provider'

export function PurchaseOrdersPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('purchases.manage')

  const { data: orders, isLoading } = usePurchaseOrders()
  const deletePO = useDeletePurchaseOrder()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderWithRelations | null>(null)
  const [deletingPO, setDeletingPO] = useState<PurchaseOrderWithRelations | null>(null)

  const filtered = useMemo(() => {
    return (orders ?? []).filter((po) => (statusFilter === 'all' ? true : po.status === statusFilter))
  }, [orders, statusFilter])

  const columns: ColumnDef<PurchaseOrderWithRelations>[] = [
    {
      id: 'po_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="PO Number" />,
      accessorFn: (row) => row.po_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => setSelectedPO(row.original)}>
          {row.original.po_number}
        </button>
      ),
    },
    { id: 'supplier', header: 'Supplier', cell: ({ row }) => row.original.supplier.name },
    { id: 'warehouse', header: 'Deliver To', cell: ({ row }) => row.original.warehouse.name },
    {
      id: 'order_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
      accessorFn: (row) => row.order_date,
      cell: ({ row }) => new Date(row.original.order_date).toLocaleDateString(),
    },
    {
      id: 'total',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      accessorFn: (row) => row.total,
      cell: ({ row }) => `₹${row.original.total.toLocaleString('en-IN')}`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={PO_STATUS_LABELS[row.original.status as keyof typeof PO_STATUS_LABELS]} />,
    },
    {
      id: 'actions',
      cell: ({ row }) =>
        canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedPO(row.original)}>
                <FileText /> View Details
              </DropdownMenuItem>
              {row.original.status === 'draft' && (
                <DropdownMenuItem variant="destructive" onClick={() => setDeletingPO(row.original)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create and track purchase orders sent to suppliers."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Purchase Order
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
            <Input placeholder="Search purchase orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(PO_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={FileText} title="No purchase orders yet" description="Create your first purchase order to start ordering from suppliers." />}
      />

      <PurchaseOrderFormDrawer open={formOpen} onOpenChange={setFormOpen} />
      <PurchaseOrderDetailSheet open={Boolean(selectedPO)} onOpenChange={(open) => !open && setSelectedPO(null)} purchaseOrder={selectedPO} />

      <DeleteConfirmDialog
        open={Boolean(deletingPO)}
        onOpenChange={(open) => !open && setDeletingPO(null)}
        title="Delete purchase order?"
        description={`This will permanently delete "${deletingPO?.po_number}".`}
        isPending={deletePO.isPending}
        onConfirm={() => deletingPO && deletePO.mutate(deletingPO.id, { onSuccess: () => setDeletingPO(null) })}
      />
    </div>
  )
}

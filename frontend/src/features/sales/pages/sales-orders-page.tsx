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
import { useDeleteSalesOrder, useSalesOrders } from '@/features/sales/hooks/use-sales-orders'
import { SalesOrderFormDrawer } from '@/features/sales/components/sales-order-form-drawer'
import { SalesOrderDetailSheet } from '@/features/sales/components/sales-order-detail-sheet'
import { SO_STATUS_LABELS, type SalesOrderWithRelations } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

export function SalesOrdersPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')

  const { data: orders, isLoading } = useSalesOrders()
  const deleteSO = useDeleteSalesOrder()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<SalesOrderWithRelations | null>(null)
  const [deleting, setDeleting] = useState<SalesOrderWithRelations | null>(null)

  const filtered = useMemo(() => (orders ?? []).filter((so) => (statusFilter === 'all' ? true : so.status === statusFilter)), [orders, statusFilter])

  const columns: ColumnDef<SalesOrderWithRelations>[] = [
    {
      id: 'so_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="SO Number" />,
      accessorFn: (row) => row.so_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => setSelected(row.original)}>
          {row.original.so_number}
        </button>
      ),
    },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'warehouse', header: 'Warehouse', cell: ({ row }) => row.original.warehouse.name },
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
      cell: ({ row }) => <StatusBadge status={row.original.status} label={SO_STATUS_LABELS[row.original.status as keyof typeof SO_STATUS_LABELS]} />,
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
              <DropdownMenuItem onClick={() => setSelected(row.original)}>
                <FileText /> View Details
              </DropdownMenuItem>
              {row.original.status === 'draft' && (
                <DropdownMenuItem variant="destructive" onClick={() => setDeleting(row.original)}>
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
        title="Sales Orders"
        description="Track confirmed customer orders through delivery and invoicing."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Sales Order
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
            <Input placeholder="Search sales orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(SO_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={FileText} title="No sales orders yet" description="Create a sales order directly or convert an accepted quotation." />}
      />

      <SalesOrderFormDrawer open={formOpen} onOpenChange={setFormOpen} />
      <SalesOrderDetailSheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} salesOrder={selected} />

      <DeleteConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete sales order?"
        description={`This will permanently delete "${deleting?.so_number}".`}
        isPending={deleteSO.isPending}
        onConfirm={() => deleting && deleteSO.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}

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
import { useDeleteQuotation, useQuotations } from '@/features/sales/hooks/use-quotations'
import { QuotationFormDrawer } from '@/features/sales/components/quotation-form-drawer'
import { QuotationDetailSheet } from '@/features/sales/components/quotation-detail-sheet'
import { QUOTATION_STATUS_LABELS, type QuotationWithRelations } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

export function QuotationsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')

  const { data: quotations, isLoading } = useQuotations()
  const deleteQuotation = useDeleteQuotation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<QuotationWithRelations | null>(null)
  const [deleting, setDeleting] = useState<QuotationWithRelations | null>(null)

  const filtered = useMemo(() => (quotations ?? []).filter((q) => (statusFilter === 'all' ? true : q.status === statusFilter)), [quotations, statusFilter])

  const columns: ColumnDef<QuotationWithRelations>[] = [
    {
      id: 'quotation_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quotation #" />,
      accessorFn: (row) => row.quotation_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => setSelected(row.original)}>
          {row.original.quotation_number}
        </button>
      ),
    },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    {
      id: 'quotation_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      accessorFn: (row) => row.quotation_date,
      cell: ({ row }) => new Date(row.original.quotation_date).toLocaleDateString(),
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
      cell: ({ row }) => <StatusBadge status={row.original.status} label={QUOTATION_STATUS_LABELS[row.original.status as keyof typeof QUOTATION_STATUS_LABELS]} />,
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
        title="Quotations"
        description="Create and track price quotations sent to customers."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Quotation
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
            <Input placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={FileText} title="No quotations yet" description="Create your first quotation to send pricing to a customer." />}
      />

      <QuotationFormDrawer open={formOpen} onOpenChange={setFormOpen} />
      <QuotationDetailSheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} quotation={selected} />

      <DeleteConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete quotation?"
        description={`This will permanently delete "${deleting?.quotation_number}".`}
        isPending={deleteQuotation.isPending}
        onConfirm={() => deleting && deleteQuotation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}

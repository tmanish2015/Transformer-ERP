import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { FileText, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalesInvoices } from '@/features/sales/hooks/use-sales-invoices'
import { CreateInvoiceDialog } from '@/features/sales/components/create-invoice-dialog'
import { SalesInvoiceDetailDialog } from '@/features/sales/components/sales-invoice-detail-dialog'
import { INVOICE_STATUS_LABELS, isInvoiceOverdue, type SalesInvoiceWithRelations } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

export function SalesInvoicesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')

  const { data, isLoading } = useSalesInvoices()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<SalesInvoiceWithRelations | null>(null)

  const filtered = useMemo(() => {
    return (data ?? []).filter((invoice) => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'overdue') return isInvoiceOverdue(invoice)
      return invoice.status === statusFilter
    })
  }, [data, statusFilter])

  const columns: ColumnDef<SalesInvoiceWithRelations>[] = [
    {
      id: 'invoice_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
      accessorFn: (row) => row.invoice_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => setSelected(row.original)}>
          {row.original.invoice_number}
        </button>
      ),
    },
{ id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'gstin', header: 'GSTIN', cell: ({ row }) => row.original.customer.gstin ?? <span className="text-muted-foreground">—</span> },
    { id: 'so_number', header: 'Sales Order', cell: ({ row }) => row.original.sales_order?.so_number ?? <span className="text-muted-foreground">—</span> },
    {
      id: 'invoice_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice Date" />,
      accessorFn: (row) => row.invoice_date,
      cell: ({ row }) => new Date(row.original.invoice_date).toLocaleDateString(),
    },
    {
      id: 'total',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      accessorFn: (row) => row.total,
      cell: ({ row }) => `₹${row.original.total.toLocaleString('en-IN')}`,
    },
    { id: 'balance', header: 'Balance Due', cell: ({ row }) => `₹${(row.original.total - row.original.amount_received).toLocaleString('en-IN')}` },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const overdue = isInvoiceOverdue(row.original)
        return <StatusBadge status={overdue ? 'overdue' : row.original.status} label={overdue ? 'Overdue' : INVOICE_STATUS_LABELS[row.original.status as keyof typeof INVOICE_STATUS_LABELS]} />
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices"
        description="Invoice customers from confirmed sales orders and track receivables."
        actions={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> New Invoice
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
            <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={FileText} title="No invoices yet" description="Create an invoice from a confirmed sales order." />}
      />

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <SalesInvoiceDetailDialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} invoice={selected} />
    </div>
  )
}

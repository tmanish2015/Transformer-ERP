import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePurchaseBills } from '@/features/purchases/hooks/use-purchase-bills'
import { CreateBillDialog } from '@/features/purchases/components/create-bill-dialog'
import { BillDetailDialog } from '@/features/purchases/components/bill-detail-dialog'
import { BILL_STATUS_LABELS, isBillOverdue, type PurchaseBillWithRelations } from '@/features/purchases/types/purchase-types'
import { useAuth } from '@/providers/auth-provider'

export function PurchaseBillsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('purchases.manage')
  const { data: bills, isLoading } = usePurchaseBills()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<PurchaseBillWithRelations | null>(null)

  const filtered = useMemo(() => {
    return (bills ?? []).filter((bill) => {
      if (statusFilter === 'overdue') return isBillOverdue(bill)
      if (statusFilter !== 'all') return bill.status === statusFilter
      return true
    })
  }, [bills, statusFilter])

  const columns: ColumnDef<PurchaseBillWithRelations>[] = [
    {
      id: 'bill_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bill Number" />,
      accessorFn: (row) => row.bill_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => setSelectedBill(row.original)}>
          {row.original.bill_number}
        </button>
      ),
    },
    { id: 'supplier', header: 'Supplier', cell: ({ row }) => row.original.supplier.name },
    { id: 'po_number', header: 'Purchase Order', cell: ({ row }) => row.original.purchase_order?.po_number ?? '—' },
    {
      id: 'due_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      accessorFn: (row) => row.due_date,
      cell: ({ row }) => (row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '—'),
    },
    {
      id: 'total',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      accessorFn: (row) => row.total,
      cell: ({ row }) => `₹${row.original.total.toLocaleString('en-IN')}`,
    },
    { id: 'balance', header: 'Balance Due', cell: ({ row }) => `₹${(row.original.total - row.original.amount_paid).toLocaleString('en-IN')}` },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const overdue = isBillOverdue(row.original)
        return <StatusBadge status={overdue ? 'overdue' : row.original.status} label={overdue ? 'Overdue' : BILL_STATUS_LABELS[row.original.status as keyof typeof BILL_STATUS_LABELS]} />
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Bills"
        description="Supplier bills and payment status."
        actions={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> New Bill
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
            <Input placeholder="Search bills..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                {Object.entries(BILL_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={Receipt} title="No bills yet" description="Create a bill from a received purchase order to start tracking payments." />}
      />

      <CreateBillDialog open={createOpen} onOpenChange={setCreateOpen} />
      <BillDetailDialog open={Boolean(selectedBill)} onOpenChange={(open) => !open && setSelectedBill(null)} bill={selectedBill} />
    </div>
  )
}

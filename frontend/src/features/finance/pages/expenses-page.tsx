import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExpenses } from '@/features/finance/hooks/use-expenses'
import { ExpenseFormDialog } from '@/features/finance/components/expense-form-dialog'
import { EXPENSE_PAYMENT_METHOD_LABELS, type ExpenseWithRelations } from '@/features/finance/types/finance-types'
import { useAuth } from '@/providers/auth-provider'

export function ExpensesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('finance.manage')

  const { data: expenses, isLoading } = useExpenses()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const columns: ColumnDef<ExpenseWithRelations>[] = [
    {
      id: 'expense_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expense #" />,
      accessorFn: (row) => row.expense_number,
    },
    {
      id: 'expense_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      accessorFn: (row) => row.expense_date,
      cell: ({ row }) => new Date(row.original.expense_date).toLocaleDateString(),
    },
    { id: 'category', header: 'Category', cell: ({ row }) => row.original.category?.name ?? '—' },
    { id: 'description', header: 'Description', cell: ({ row }) => row.original.description },
    {
      id: 'payee',
      header: 'Payee',
      cell: ({ row }) => row.original.supplier?.name ?? row.original.payee_name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'repair_job',
      header: 'Work Order',
      cell: ({ row }) => row.original.repair_job?.job_number ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      accessorFn: (row) => row.amount,
      cell: ({ row }) => `₹${row.original.amount.toLocaleString('en-IN')}`,
    },
    {
      id: 'payment_method',
      header: 'Payment Method',
      cell: ({ row }) => EXPENSE_PAYMENT_METHOD_LABELS[row.original.payment_method as keyof typeof EXPENSE_PAYMENT_METHOD_LABELS] ?? row.original.payment_method,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Record operating expenses -- each one posts straight to the ledger."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Record Expense
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={expenses ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Receipt} title="No expenses yet" description="Record your first operating expense." />}
      />

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}

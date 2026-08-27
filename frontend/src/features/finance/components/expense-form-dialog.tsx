import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { expenseSchema, type ExpenseFormInput, type ExpenseFormValues } from '@/features/finance/schemas/finance-schemas'
import { useCreateExpense } from '@/features/finance/hooks/use-expenses'
import { useChartOfAccounts } from '@/features/finance/hooks/use-chart-of-accounts'
import { EXPENSE_PAYMENT_METHODS, EXPENSE_PAYMENT_METHOD_LABELS } from '@/features/finance/types/finance-types'
import { useSuppliers } from '@/features/inventory/hooks/use-suppliers'
import { useRepairJobs } from '@/features/workshop/hooks/use-repair-jobs'
import { useAuth } from '@/providers/auth-provider'

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseFormDialog({ open, onOpenChange }: ExpenseFormDialogProps) {
  const { user } = useAuth()
  const { data: accounts } = useChartOfAccounts()
  const { data: suppliers } = useSuppliers()
  const { data: repairJobs } = useRepairJobs()
  const createExpense = useCreateExpense()

  const expenseAccounts = (accounts ?? []).filter((a) => a.account_type === 'expense' && !a.is_group)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date().toISOString().slice(0, 10),
      category_id: '',
      description: '',
      supplier_id: '',
      payee_name: '',
      repair_job_id: '',
      amount: undefined,
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    },
  })

  const onSubmit = (values: ExpenseFormValues) => {
    if (!user) return
    createExpense.mutate(
      { values, createdBy: user.id },
      {
        onSuccess: () => {
          onOpenChange(false)
          reset()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
          <DialogDescription>Posts to the ledger immediately against the selected category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expense_date">Date</Label>
              <Input id="expense_date" type="date" {...register('expense_date')} />
              {errors.expense_date && <p className="text-xs text-destructive">{errors.expense_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={expenseAccounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Supplier (optional)</Label>
              <Controller
                control={control}
                name="supplier_id"
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    items={[{ value: 'none', label: 'None' }, ...(suppliers ?? []).map((s) => ({ value: s.id, label: s.name }))]}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {suppliers?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payee_name">Payee (if no supplier)</Label>
              <Input id="payee_name" {...register('payee_name')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Work Order / Repair Job (optional)</Label>
            <Controller
              control={control}
              name="repair_job_id"
              render={({ field }) => (
                <Select
                  value={field.value || 'none'}
                  onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  items={[{ value: 'none', label: 'None' }, ...(repairJobs ?? []).map((j) => ({ value: j.id, label: j.job_number }))]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {repairJobs?.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.job_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Controller
                control={control}
                name="payment_method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'cash')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_PAYMENT_METHODS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {EXPENSE_PAYMENT_METHOD_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference_number">Reference / Receipt No. (optional)</Label>
            <Input id="reference_number" {...register('reference_number')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending && <Loader2 className="size-4 animate-spin" />}
              Record expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

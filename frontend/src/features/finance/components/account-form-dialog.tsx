import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { accountSchema, type AccountFormInput, type AccountFormValues } from '@/features/finance/schemas/finance-schemas'
import { useChartOfAccounts, useCreateAccount, useUpdateAccount } from '@/features/finance/hooks/use-chart-of-accounts'
import { ACCOUNT_TYPE_LABELS, type ChartOfAccount } from '@/features/finance/types/finance-types'

const ACCOUNT_GROUPS = [
  { value: 'current_asset', label: 'Current Asset' },
  { value: 'fixed_asset', label: 'Fixed Asset' },
  { value: 'current_liability', label: 'Current Liability' },
  { value: 'long_term_liability', label: 'Long Term Liability' },
  { value: 'capital', label: 'Capital' },
  { value: 'direct_income', label: 'Direct Income' },
  { value: 'indirect_income', label: 'Indirect Income' },
  { value: 'direct_expense', label: 'Direct Expense' },
  { value: 'indirect_expense', label: 'Indirect Expense' },
  { value: 'cogs', label: 'Cost of Goods Sold' },
]

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: ChartOfAccount
  defaultParentId?: string
}

export function AccountFormDialog({ open, onOpenChange, account, defaultParentId }: AccountFormDialogProps) {
  const { data: accounts } = useChartOfAccounts()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const isEdit = Boolean(account)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AccountFormInput, unknown, AccountFormValues>({
    resolver: zodResolver(accountSchema),
    values: {
      code: account?.code ?? '',
      name: account?.name ?? '',
      account_type: (account?.account_type as AccountFormValues['account_type']) ?? 'asset',
      account_group: (account?.account_group as AccountFormValues['account_group']) ?? 'current_asset',
      parent_id: account?.parent_id ?? defaultParentId ?? '',
      is_group: account?.is_group ?? false,
      opening_balance: account?.opening_balance ?? 0,
      opening_balance_type: (account?.opening_balance_type as 'debit' | 'credit') ?? 'debit',
    },
  })

  const isGroup = watch('is_group')

  const onSubmit = (values: AccountFormValues) => {
    if (isEdit && account) {
      updateAccount.mutate({ id: account.id, values }, { onSuccess: () => onOpenChange(false) })
    } else {
      createAccount.mutate(values, {
        onSuccess: () => {
          onOpenChange(false)
          reset()
        },
      })
    }
  }

  const isPending = createAccount.isPending || updateAccount.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Account' : 'New Account'}</DialogTitle>
          <DialogDescription>Define a ledger account in the chart of accounts.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="e.g. 6006" {...register('code')} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Advertising Expense" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Account Type</Label>
              <Controller
                control={control}
                name="account_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account Group</Label>
              <Controller
                control={control}
                name="account_group"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_GROUPS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Parent Account (optional)</Label>
            <Controller
              control={control}
              name="parent_id"
              render={({ field }) => (
                <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No parent (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (top-level)</SelectItem>
                    {accounts
                      ?.filter((a) => a.is_group && a.id !== account?.id)
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} · {a.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Group Account</p>
              <p className="text-xs text-muted-foreground">Group accounts organize the tree and cannot post transactions.</p>
            </div>
            <Controller control={control} name="is_group" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </div>

          {!isGroup && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input id="opening_balance" type="number" step="0.01" {...register('opening_balance')} />
              </div>
              <div className="space-y-1.5">
                <Label>Balance Type</Label>
                <Controller
                  control={control}
                  name="opening_balance_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

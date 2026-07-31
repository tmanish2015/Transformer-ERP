import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { salesPaymentSchema, type SalesPaymentFormInput, type SalesPaymentFormValues } from '@/features/sales/schemas/sales-schemas'
import { useCreateSalesPayment, useSalesInvoiceItems, useSalesPayments } from '@/features/sales/hooks/use-sales-invoices'
import { INVOICE_STATUS_LABELS, INVOICE_TYPE_LABELS, PAYMENT_METHOD_LABELS, isInvoiceOverdue, outstandingAmount, type SalesInvoiceWithRelations } from '@/features/sales/types/sales-types'
import { useAuth } from '@/providers/auth-provider'

interface SalesInvoiceDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: SalesInvoiceWithRelations | null
}

export function SalesInvoiceDetailDialog({ open, onOpenChange, invoice }: SalesInvoiceDetailDialogProps) {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')
  const { data: items } = useSalesInvoiceItems(invoice?.id)
  const { data: payments } = useSalesPayments(invoice?.id)
  const createPayment = useCreateSalesPayment(invoice?.id)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesPaymentFormInput, unknown, SalesPaymentFormValues>({
    resolver: zodResolver(salesPaymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().slice(0, 10),
      amount: 0,
      payment_method: 'bank_transfer',
      reference_number: '',
      notes: '',
    },
  })

  if (!invoice) return null

  const balanceDue = outstandingAmount(invoice)
  const overdue = isInvoiceOverdue(invoice)

  const onSubmit = (values: SalesPaymentFormValues) => {
    createPayment.mutate(values, {
      onSuccess: () =>
        reset({
          payment_date: new Date().toISOString().slice(0, 10),
          amount: 0,
          payment_method: values.payment_method,
          reference_number: '',
          notes: '',
        }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice.invoice_number}</DialogTitle>
          <DialogDescription>{invoice.customer.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={overdue ? 'overdue' : invoice.status} label={overdue ? 'Overdue' : INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS]} />
              <span className="text-xs text-muted-foreground">{INVOICE_TYPE_LABELS[invoice.invoice_type as keyof typeof INVOICE_TYPE_LABELS]}</span>
            </div>
            <span className="text-sm text-muted-foreground">Due {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-foreground">₹{invoice.total.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Received</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">₹{invoice.amount_received.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance</p>
              <p className="font-semibold text-foreground">₹{balanceDue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {items && items.length > 0 && (
            <div className="space-y-1.5">
              <Separator />
              <p className="text-sm font-medium text-foreground">Items</p>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product?.name ?? item.description} × {item.quantity}
                    {item.product && <span className="ml-1 text-xs">(HSN {item.product.hsn_code ?? '—'})</span>}
                  </span>
                  <span className="font-medium text-foreground">₹{(item.line_total ?? 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          {payments && payments.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <p className="text-sm font-medium text-foreground">Payment History</p>
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString()} · {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}
                    {p.reference_number ? ` · ${p.reference_number}` : ''}
                  </span>
                  <span className="font-medium text-foreground">₹{p.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          {canManage && balanceDue > 0 && (
            <>
              <Separator />
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm font-medium text-foreground">Record Payment</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" step="0.01" {...register('amount')} />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input id="payment_date" type="date" {...register('payment_date')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Method</Label>
                    <Controller
                      control={control}
                      name="payment_method"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'bank_transfer')}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
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
                    <Label htmlFor="reference_number">Reference #</Label>
                    <Input id="reference_number" {...register('reference_number')} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createPayment.isPending}>
                    {createPayment.isPending && <Loader2 className="size-4 animate-spin" />}
                    Record Payment
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { salesInvoiceSchema, type SalesInvoiceFormInput, type SalesInvoiceFormValues } from '@/features/sales/schemas/sales-schemas'
import { useCreateSalesInvoice, useInvoiceableSalesOrders } from '@/features/sales/hooks/use-sales-invoices'

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const { data: invoiceableSOs } = useInvoiceableSalesOrders()
  const createInvoice = useCreateSalesInvoice()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesInvoiceFormInput, unknown, SalesInvoiceFormValues>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: {
      sales_order_id: '',
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      notes: '',
    },
  })

  const onSubmit = (values: SalesInvoiceFormValues) => {
    createInvoice.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Sales Invoice</DialogTitle>
          <DialogDescription>Invoice all items on a confirmed sales order. Posts to the ledger automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Sales Order</Label>
            <Controller
              control={control}
              name="sales_order_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sales order" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceableSOs?.map((so) => (
                      <SelectItem key={so.id} value={so.id}>
                        {so.so_number} — {so.customer.name} (₹{so.total.toLocaleString('en-IN')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sales_order_id && <p className="text-xs text-destructive">{errors.sales_order_id.message}</p>}
            {invoiceableSOs?.length === 0 && <p className="text-xs text-muted-foreground">No sales orders are awaiting an invoice.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input id="invoice_date" type="date" {...register('invoice_date')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

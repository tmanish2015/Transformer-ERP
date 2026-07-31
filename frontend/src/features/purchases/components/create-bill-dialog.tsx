import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { purchaseBillSchema, type PurchaseBillFormInput, type PurchaseBillFormValues } from '@/features/purchases/schemas/purchase-schemas'
import { useBillablePOs, useCreatePurchaseBill } from '@/features/purchases/hooks/use-purchase-bills'

interface CreateBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBillDialog({ open, onOpenChange }: CreateBillDialogProps) {
  const { data: billablePOs } = useBillablePOs()
  const createBill = useCreatePurchaseBill()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseBillFormInput, unknown, PurchaseBillFormValues>({
    resolver: zodResolver(purchaseBillSchema),
    defaultValues: {
      purchase_order_id: '',
      bill_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      notes: '',
    },
  })

  const onSubmit = (values: PurchaseBillFormValues) => {
    createBill.mutate(values, {
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
          <DialogTitle>New Supplier Bill</DialogTitle>
          <DialogDescription>Create a bill from a received purchase order. Amounts are taken from the PO.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Purchase Order</Label>
            <Controller
              control={control}
              name="purchase_order_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select received purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {billablePOs?.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.po_number} — {po.supplier.name} (₹{po.total.toLocaleString('en-IN')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.purchase_order_id && <p className="text-xs text-destructive">{errors.purchase_order_id.message}</p>}
            {billablePOs?.length === 0 && <p className="text-xs text-muted-foreground">No received purchase orders are awaiting a bill.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bill_date">Bill Date</Label>
              <Input id="bill_date" type="date" {...register('bill_date')} />
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
            <Button type="submit" disabled={createBill.isPending}>
              {createBill.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

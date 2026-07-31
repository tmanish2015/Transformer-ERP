import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { goodsReceiptSchema, type GoodsReceiptFormInput, type GoodsReceiptFormValues } from '@/features/purchases/schemas/purchase-schemas'
import { useReceivablePOs, useCreateGoodsReceipt } from '@/features/purchases/hooks/use-goods-receipts'
import { usePurchaseOrderItems } from '@/features/purchases/hooks/use-purchase-orders'

interface ReceiveGoodsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiveGoodsDialog({ open, onOpenChange }: ReceiveGoodsDialogProps) {
  const { data: receivablePOs } = useReceivablePOs()
  const [selectedPOId, setSelectedPOId] = useState('')
  const { data: poItems } = usePurchaseOrderItems(selectedPOId || undefined)
  const createReceipt = useCreateGoodsReceipt()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoodsReceiptFormInput, unknown, GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: {
      purchase_order_id: '',
      received_date: new Date().toISOString().slice(0, 10),
      notes: '',
      items: [],
    },
  })

  const { fields, replace } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (!open) {
      setSelectedPOId('')
      reset({
        purchase_order_id: '',
        received_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: [],
      })
    }
  }, [open, reset])

  useEffect(() => {
    if (poItems) {
      const outstanding = poItems.filter((item) => item.received_quantity < item.quantity)
      replace(
        outstanding.map((item) => ({
          purchase_order_item_id: item.id,
          product_id: item.product_id,
          product_name: `${item.product.name} (${item.product.sku})`,
          hsn_code: item.product.hsn_code,
          outstanding: item.quantity - item.received_quantity,
          quantity_received: item.quantity - item.received_quantity,
        })),
      )
    }
  }, [poItems, replace])

  const onSubmit = (values: GoodsReceiptFormValues) => {
    createReceipt.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Receive Goods</DialogTitle>
          <DialogDescription>Record items received against an open purchase order. Stock is updated immediately.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Purchase Order</Label>
              <Controller
                control={control}
                name="purchase_order_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value ?? '')
                      setSelectedPOId(value ?? '')
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select purchase order" />
                    </SelectTrigger>
                    <SelectContent>
                      {receivablePOs?.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.po_number} — {po.supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.purchase_order_id && <p className="text-xs text-destructive">{errors.purchase_order_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="received_date">Received Date</Label>
              <Input id="received_date" type="date" {...register('received_date')} />
            </div>
          </div>

          {fields.length > 0 && (
            <div className="rounded-lg border border-border">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Product</TableHead>
                    <TableHead className="w-24">HSN Code</TableHead>
                    <TableHead className="w-24 text-right">Outstanding</TableHead>
                    <TableHead className="w-28 text-right">Receiving</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.product_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{field.hsn_code ?? '—'}</TableCell>
                      <TableCell className="text-right">{field.outstanding}</TableCell>
                      <TableCell className="text-right">
                        <Input type="number" step="1" min="0" className="text-right" {...register(`items.${index}.quantity_received`)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedPOId && fields.length === 0 && <p className="text-sm text-muted-foreground">This purchase order has no outstanding items to receive.</p>}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createReceipt.isPending || fields.length === 0}>
              {createReceipt.isPending && <Loader2 className="size-4 animate-spin" />}
              Record Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

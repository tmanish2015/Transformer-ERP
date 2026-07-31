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
import { deliveryChallanSchema, type DeliveryChallanFormInput, type DeliveryChallanFormValues } from '@/features/sales/schemas/sales-schemas'
import { useCreateDeliveryChallan, useDeliverableSalesOrders } from '@/features/sales/hooks/use-delivery-challans'
import { useSalesOrderItems } from '@/features/sales/hooks/use-sales-orders'

interface DeliverGoodsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selects a sales order, e.g. when arriving from a sales-order detail shortcut. */
  initialSalesOrderId?: string
}

export function DeliverGoodsDialog({ open, onOpenChange, initialSalesOrderId }: DeliverGoodsDialogProps) {
  const { data: deliverableSOs } = useDeliverableSalesOrders()
  const [selectedSOId, setSelectedSOId] = useState('')
  const { data: soItems } = useSalesOrderItems(selectedSOId || undefined)
  const createDC = useCreateDeliveryChallan()

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DeliveryChallanFormInput, unknown, DeliveryChallanFormValues>({
    resolver: zodResolver(deliveryChallanSchema),
    defaultValues: {
      sales_order_id: '',
      delivery_date: new Date().toISOString().slice(0, 10),
      vehicle_number: '',
      notes: '',
      items: [],
    },
  })

  const { fields, replace } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (!open) {
      setSelectedSOId('')
      reset({
        sales_order_id: '',
        delivery_date: new Date().toISOString().slice(0, 10),
        vehicle_number: '',
        notes: '',
        items: [],
      })
    } else if (initialSalesOrderId) {
      setSelectedSOId(initialSalesOrderId)
      setValue('sales_order_id', initialSalesOrderId)
    }
  }, [open, initialSalesOrderId, reset, setValue])

  useEffect(() => {
    if (soItems) {
      const outstanding = soItems.filter((item) => item.delivered_quantity < item.quantity)
      replace(
        outstanding.map((item) => ({
          sales_order_item_id: item.id,
          product_id: item.product_id,
          product_name: `${item.product.name} (${item.product.sku})`,
          hsn_code: item.product.hsn_code,
          outstanding: item.quantity - item.delivered_quantity,
          quantity_delivered: item.quantity - item.delivered_quantity,
        })),
      )
    }
  }, [soItems, replace])

  const onSubmit = (values: DeliveryChallanFormValues) => {
    createDC.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Delivery Challan</DialogTitle>
          <DialogDescription>Record items delivered against an open sales order. Stock is reduced immediately.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sales Order</Label>
              <Controller
                control={control}
                name="sales_order_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value ?? '')
                      setSelectedSOId(value ?? '')
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sales order" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliverableSOs?.map((so) => (
                        <SelectItem key={so.id} value={so.id}>
                          {so.so_number} — {so.customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sales_order_id && <p className="text-xs text-destructive">{errors.sales_order_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input id="delivery_date" type="date" {...register('delivery_date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vehicle_number">Vehicle Number</Label>
            <Input id="vehicle_number" placeholder="e.g. RJ14GB1234" {...register('vehicle_number')} />
          </div>

          {fields.length > 0 && (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">HSN Code</TableHead>
                    <TableHead className="w-24 text-right">Outstanding</TableHead>
                    <TableHead className="w-28 text-right">Delivering</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.product_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{field.hsn_code ?? '—'}</TableCell>
                      <TableCell className="text-right">{field.outstanding}</TableCell>
                      <TableCell className="text-right">
                        <Input type="number" step="0.01" className="text-right" {...register(`items.${index}.quantity_delivered`)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedSOId && fields.length === 0 && <p className="text-sm text-muted-foreground">This sales order has no outstanding items to deliver.</p>}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDC.isPending || fields.length === 0}>
              {createDC.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Delivery Challan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

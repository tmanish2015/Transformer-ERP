import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { purchaseOrderSchema, type PurchaseOrderFormInput, type PurchaseOrderFormValues } from '@/features/purchases/schemas/purchase-schemas'
import { useSuppliers } from '@/features/inventory/hooks/use-suppliers'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import { useProducts } from '@/features/inventory/hooks/use-products'
import { useCreatePurchaseOrder } from '@/features/purchases/hooks/use-purchase-orders'

interface PurchaseOrderFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyItem = { product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }

export function PurchaseOrderFormDrawer({ open, onOpenChange }: PurchaseOrderFormDrawerProps) {
  const { data: suppliers } = useSuppliers()
  const { data: warehouses } = useWarehouses()
  const { data: products } = useProducts()
  const createPO = useCreatePurchaseOrder()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormInput, unknown, PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      expected_date: '',
      notes: '',
      items: [emptyItem],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  useEffect(() => {
    if (open) {
      reset({
        supplier_id: '',
        warehouse_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        expected_date: '',
        notes: '',
        items: [emptyItem],
      })
    }
  }, [open, reset])

  const onSubmit = (values: PurchaseOrderFormValues) => {
    createPO.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  const grandTotal = (items ?? []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    const gst = Number(item.gst_rate) || 0
    return sum + qty * price * (1 + gst / 100)
  }, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-none">
        <SheetHeader className="mx-auto w-full max-w-4xl">
          <SheetTitle>New Purchase Order</SheetTitle>
          <SheetDescription>Create a purchase order to send to a supplier.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <form id="po-form" onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-4xl space-y-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Controller
                  control={control}
                  name="supplier_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.supplier_id && <p className="text-xs text-destructive">{errors.supplier_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Deliver To</Label>
                <Controller
                  control={control}
                  name="warehouse_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.warehouse_id && <p className="text-xs text-destructive">{errors.warehouse_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="order_date">Order Date</Label>
                <Input id="order_date" type="date" {...register('order_date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expected_date">Expected Date</Label>
                <Input id="expected_date" type="date" {...register('expected_date')} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItem)}>
                  <Plus className="size-3.5" /> Add Item
                </Button>
              </div>
              {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}

              <div className="rounded-lg border border-border">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Product</TableHead>
                      <TableHead className="w-24">HSN Code</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-28">Unit Price</TableHead>
                      <TableHead className="w-20">GST %</TableHead>
                      <TableHead className="w-24 text-right">Line Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const item = items?.[index]
                      const product = products?.find((p) => p.id === item?.product_id)
                      const lineTotal = (Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0) * (1 + (Number(item?.gst_rate) || 0) / 100)
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`items.${index}.product_id`}
                              render={({ field: productField }) => (
                                <Select
                                  value={productField.value}
                                  onValueChange={(value) => {
                                    productField.onChange(value)
                                    const product = products?.find((p) => p.id === value)
                                    if (product) {
                                      setValue(`items.${index}.unit_price`, product.purchase_price)
                                      setValue(`items.${index}.gst_rate`, product.gst_rate)
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products?.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{product?.hsn_code ?? '—'}</TableCell>
                          <TableCell>
                            <Input type="number" step="1" min="0" {...register(`items.${index}.quantity`)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" {...register(`items.${index}.unit_price`)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" {...register(`items.${index}.gst_rate`)} />
                          </TableCell>
                          <TableCell className="text-right font-medium">₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon-sm" disabled={fields.length === 1} onClick={() => remove(index)}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="text-sm">
                  <span className="text-muted-foreground">Grand Total: </span>
                  <span className="font-semibold text-foreground">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} {...register('notes')} />
            </div>
          </form>
        </ScrollArea>

        <div className="border-t border-border px-4 py-3">
          <div className="mx-auto flex w-full max-w-4xl justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="po-form" disabled={createPO.isPending}>
              {createPO.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Purchase Order
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

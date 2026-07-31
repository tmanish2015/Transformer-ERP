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
import { repairEstimateSchema, type RepairEstimateFormInput, type RepairEstimateFormValues } from '@/features/workshop/schemas/workshop-schemas'
import { ESTIMATE_ITEM_TYPE_LABELS } from '@/features/workshop/types/workshop-types'
import { useCreateRepairEstimate } from '@/features/workshop/hooks/use-repair-estimates'
import { useProducts } from '@/features/inventory/hooks/use-products'

interface RepairEstimateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairJobId: string
}

const emptyItem = { item_type: 'labor' as const, product_id: '', description: '', quantity: 1, unit_price: 0, gst_rate: 18 }

export function RepairEstimateFormDialog({ open, onOpenChange, repairJobId }: RepairEstimateFormDialogProps) {
  const { data: products } = useProducts()
  const createEstimate = useCreateRepairEstimate()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RepairEstimateFormInput, unknown, RepairEstimateFormValues>({
    resolver: zodResolver(repairEstimateSchema),
    defaultValues: {
      repair_job_id: repairJobId,
      estimate_date: new Date().toISOString().slice(0, 10),
      notes: '',
      items: [emptyItem],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  useEffect(() => {
    if (open) {
      reset({
        repair_job_id: repairJobId,
        estimate_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: [emptyItem],
      })
    }
  }, [open, repairJobId, reset])

  const onSubmit = (values: RepairEstimateFormValues) => {
    createEstimate.mutate(values, { onSuccess: () => onOpenChange(false) })
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
          <SheetTitle>New Repair Estimate</SheetTitle>
          <SheetDescription>Quote spare parts and labor for this repair job.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <form id="estimate-form" onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-4xl space-y-6 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="estimate_date">Estimate Date</Label>
              <Input id="estimate_date" type="date" className="max-w-xs" {...register('estimate_date')} />
              {errors.estimate_date && <p className="text-xs text-destructive">{errors.estimate_date.message}</p>}
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
                      <TableHead className="w-32">Type</TableHead>
                      <TableHead>Description</TableHead>
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
                      const lineTotal = (Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0) * (1 + (Number(item?.gst_rate) || 0) / 100)
                      const isSparePart = item?.item_type === 'spare_part'
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`items.${index}.item_type`}
                              render={({ field: typeField }) => (
                                <Select
                                  value={typeField.value}
                                  onValueChange={(value) => {
                                    typeField.onChange(value)
                                    setValue(`items.${index}.product_id`, '')
                                    setValue(`items.${index}.description`, '')
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(ESTIMATE_ITEM_TYPE_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            {isSparePart ? (
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
                                        setValue(`items.${index}.description`, product.name)
                                        setValue(`items.${index}.unit_price`, product.selling_price)
                                        setValue(`items.${index}.gst_rate`, product.gst_rate)
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select spare part" />
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
                            ) : (
                              <Input placeholder="Description" {...register(`items.${index}.description`)} />
                            )}
                            {errors.items?.[index]?.description && <p className="text-xs text-destructive">{errors.items[index]?.description?.message}</p>}
                          </TableCell>
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
            <Button type="submit" form="estimate-form" disabled={createEstimate.isPending}>
              {createEstimate.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Estimate
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

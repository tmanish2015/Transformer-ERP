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
import { rentalQuotationSchema, type RentalQuotationFormInput, type RentalQuotationFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalQuotation } from '@/features/rental/hooks/use-rental-quotations'
import { useRentalInquiries } from '@/features/rental/hooks/use-rental-inquiries'
import { useAvailableRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { useCustomers } from '@/features/sales/hooks/use-customers'

interface RentalQuotationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetInquiryId?: string
}

const emptyItem = { rental_asset_id: '', rental_days: 1, daily_rate: 0, gst_rate: 18 }

export function RentalQuotationFormDialog({ open, onOpenChange, presetInquiryId }: RentalQuotationFormDialogProps) {
  const { data: customers } = useCustomers()
  const { data: inquiries } = useRentalInquiries()
  const { data: availableAssets } = useAvailableRentalAssets()
  const createQuotation = useCreateRentalQuotation()

  const presetInquiry = inquiries?.find((i) => i.id === presetInquiryId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RentalQuotationFormInput, unknown, RentalQuotationFormValues>({
    resolver: zodResolver(rentalQuotationSchema),
    defaultValues: {
      customer_id: '',
      rental_inquiry_id: presetInquiryId ?? '',
      quotation_date: new Date().toISOString().slice(0, 10),
      valid_until: '',
      notes: '',
      items: [emptyItem],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  useEffect(() => {
    if (open) {
      reset({
        customer_id: presetInquiry?.customer_id ?? '',
        rental_inquiry_id: presetInquiryId ?? '',
        quotation_date: new Date().toISOString().slice(0, 10),
        valid_until: '',
        notes: '',
        items: [emptyItem],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetInquiryId, presetInquiry?.customer_id, reset])

  const onSubmit = (values: RentalQuotationFormValues) => {
    createQuotation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  const grandTotal = (items ?? []).reduce((sum, item) => {
    const days = Number(item.rental_days) || 0
    const rate = Number(item.daily_rate) || 0
    const gst = Number(item.gst_rate) || 0
    return sum + days * rate * (1 + gst / 100)
  }, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-none">
        <SheetHeader className="mx-auto w-full max-w-4xl">
          <SheetTitle>New Rental Quotation</SheetTitle>
          <SheetDescription>Quote one or more assets for a customer.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <form id="rental-quotation-form" onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-4xl space-y-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(presetInquiryId)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input id="valid_until" type="date" {...register('valid_until')} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assets</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItem)}>
                  <Plus className="size-3.5" /> Add Asset
                </Button>
              </div>
              {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}

              <div className="rounded-lg border border-border">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="w-20">Days</TableHead>
                      <TableHead className="w-28">Daily Rate</TableHead>
                      <TableHead className="w-20">GST %</TableHead>
                      <TableHead className="w-28 text-right">Line Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const item = items?.[index]
                      const lineTotal = (Number(item?.rental_days) || 0) * (Number(item?.daily_rate) || 0) * (1 + (Number(item?.gst_rate) || 0) / 100)
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`items.${index}.rental_asset_id`}
                              render={({ field: assetField }) => (
                                <Select
                                  value={assetField.value}
                                  onValueChange={(value) => {
                                    assetField.onChange(value)
                                    const asset = availableAssets?.find((a) => a.id === value)
                                    if (asset) setValue(`items.${index}.daily_rate`, asset.daily_rental_rate)
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select asset" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableAssets?.map((a) => (
                                      <SelectItem key={a.id} value={a.id}>
                                        {a.asset_code} — {a.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="1" min="1" {...register(`items.${index}.rental_days`)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" {...register(`items.${index}.daily_rate`)} />
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
              <Label htmlFor="quotation_notes">Notes</Label>
              <Textarea id="quotation_notes" rows={2} {...register('notes')} />
            </div>
          </form>
        </ScrollArea>

        <div className="border-t border-border px-4 py-3">
          <div className="mx-auto flex w-full max-w-4xl justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="rental-quotation-form" disabled={createQuotation.isPending}>
              {createQuotation.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Quotation
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

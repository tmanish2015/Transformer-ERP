import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bomSchema, type BomFormInput, type BomFormValues } from '@/features/manufacturing/schemas/manufacturing-schemas'
import { useCreateBom } from '@/features/manufacturing/hooks/use-boms'
import { useProducts } from '@/features/inventory/hooks/use-products'
import { useUnits } from '@/features/inventory/hooks/use-units'

interface BomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyLine = { raw_material_product_id: '', qty: 1, unit_id: '' }

export function BomFormDialog({ open, onOpenChange }: BomFormDialogProps) {
  const { data: products } = useProducts()
  const { data: units } = useUnits()
  const createBom = useCreateBom()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BomFormInput, unknown, BomFormValues>({
    resolver: zodResolver(bomSchema),
    defaultValues: { product_id: '', name: '', lines: [emptyLine] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  const onSubmit = (values: BomFormValues) => {
    createBom.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-none">
        <SheetHeader className="mx-auto w-full max-w-3xl">
          <SheetTitle>New Bill of Materials</SheetTitle>
          <SheetDescription>Raw materials required to build one unit of the finished product.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <form id="bom-form" onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-3xl space-y-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Finished Product</Label>
                <Controller
                  control={control}
                  name="product_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                {errors.product_id && <p className="text-xs text-destructive">{errors.product_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bom_name">Name</Label>
                <Input id="bom_name" placeholder="Optional label" {...register('name')} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Raw Materials</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine)}>
                  <Plus className="size-3.5" /> Add Line
                </Button>
              </div>
              {errors.lines?.message && <p className="text-xs text-destructive">{errors.lines.message}</p>}

              <div className="rounded-lg border border-border">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Raw Material</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32">Unit</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lines.${index}.raw_material_product_id`}
                            render={({ field: productField }) => (
                              <Select value={productField.value} onValueChange={productField.onChange}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select material" />
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
                        <TableCell>
                          <Input type="number" step="0.01" min="0" {...register(`lines.${index}.qty`)} />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lines.${index}.unit_id`}
                            render={({ field: unitField }) => (
                              <Select value={unitField.value} onValueChange={unitField.onChange}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {units?.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.short_code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon-sm" disabled={fields.length === 1} onClick={() => remove(index)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="border-t border-border px-4 py-3">
          <div className="mx-auto flex w-full max-w-3xl justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="bom-form" disabled={createBom.isPending}>
              {createBom.isPending && <Loader2 className="size-4 animate-spin" />}
              Create BOM
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { serialNumberSchema, type SerialNumberFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useProducts } from '@/features/inventory/hooks/use-products'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import { useCreateSerialNumber } from '@/features/inventory/hooks/use-serial-numbers'

interface SerialNumberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SerialNumberFormDialog({ open, onOpenChange }: SerialNumberFormDialogProps) {
  const { data: products } = useProducts()
  const { data: warehouses } = useWarehouses()
  const createSerialNumber = useCreateSerialNumber()

  const serialTrackedProducts = (products ?? []).filter((p) => p.is_serial_tracked)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SerialNumberFormValues>({
    resolver: zodResolver(serialNumberSchema),
    defaultValues: { product_id: '', serial_no: '', current_warehouse_id: null },
  })

  const onSubmit = (values: SerialNumberFormValues) => {
    createSerialNumber.mutate(values, {
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
          <DialogTitle>Add Serial Number</DialogTitle>
          <DialogDescription>Only products with serial tracking enabled can have serial numbers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product</Label>
            <Controller
              control={control}
              name="product_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select serial-tracked product" />
                  </SelectTrigger>
                  <SelectContent>
                    {serialTrackedProducts.map((p) => (
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
            <Label htmlFor="serial_no">Serial Number</Label>
            <Input id="serial_no" placeholder="e.g. TXF-2026-0001" {...register('serial_no')} />
            {errors.serial_no && <p className="text-xs text-destructive">{errors.serial_no.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Warehouse</Label>
            <Controller
              control={control}
              name="current_warehouse_id"
              render={({ field }) => (
                <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSerialNumber.isPending}>
              {createSerialNumber.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Serial Number
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { batchSchema, type BatchFormInput, type BatchFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useProducts } from '@/features/inventory/hooks/use-products'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import { useCreateBatch } from '@/features/inventory/hooks/use-stock'

interface BatchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BatchFormDialog({ open, onOpenChange }: BatchFormDialogProps) {
  const { data: products } = useProducts()
  const { data: warehouses } = useWarehouses()
  const createBatch = useCreateBatch()

  const batchTrackedProducts = (products ?? []).filter((p) => p.is_batch_tracked)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchFormInput, unknown, BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      product_id: '',
      warehouse_id: '',
      batch_number: '',
      manufacture_date: '',
      expiry_date: '',
      quantity: 0,
    },
  })

  const onSubmit = (values: BatchFormValues) => {
    createBatch.mutate(values, {
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
          <DialogTitle>New Batch</DialogTitle>
          <DialogDescription>Only products with batch tracking enabled can have batches.</DialogDescription>
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
                    <SelectValue placeholder="Select batch-tracked product" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchTrackedProducts.map((p) => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Warehouse</Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input id="batch_number" {...register('batch_number')} />
              {errors.batch_number && <p className="text-xs text-destructive">{errors.batch_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="manufacture_date">Manufacture Date</Label>
              <Input id="manufacture_date" type="date" {...register('manufacture_date')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input id="expiry_date" type="date" {...register('expiry_date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Opening Quantity</Label>
            <Input id="quantity" type="number" step="0.01" {...register('quantity')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBatch.isPending}>
              {createBatch.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

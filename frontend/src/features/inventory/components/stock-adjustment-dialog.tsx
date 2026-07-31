import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { stockAdjustmentSchema, type StockAdjustmentFormInput, type StockAdjustmentFormValues } from '@/features/inventory/schemas/inventory-schemas'
import { useProducts } from '@/features/inventory/hooks/use-products'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'
import { useCreateStockMovement } from '@/features/inventory/hooks/use-stock'
import { MANUAL_MOVEMENT_TYPE_LABELS } from '@/features/inventory/types/inventory-types'

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProductId?: string
  defaultWarehouseId?: string
}

export function StockAdjustmentDialog({ open, onOpenChange, defaultProductId, defaultWarehouseId }: StockAdjustmentDialogProps) {
  const { data: products } = useProducts()
  const { data: warehouses } = useWarehouses()
  const createMovement = useCreateStockMovement()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockAdjustmentFormInput, unknown, StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      product_id: defaultProductId ?? '',
      warehouse_id: defaultWarehouseId ?? '',
      movement_type: 'purchase',
      quantity: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        product_id: defaultProductId ?? '',
        warehouse_id: defaultWarehouseId ?? '',
        movement_type: 'purchase',
        quantity: 0,
        notes: '',
      })
    }
  }, [open, defaultProductId, defaultWarehouseId, reset])

  const onSubmit = (values: StockAdjustmentFormValues) => {
    createMovement.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
          <DialogDescription>Manually adjust stock. Positive quantities increase stock, negative decrease it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Product</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Movement Type</Label>
              <Controller
                control={control}
                name="movement_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MANUAL_MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" step="0.01" {...register('quantity')} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
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
            <Button type="submit" disabled={createMovement.isPending}>
              {createMovement.isPending && <Loader2 className="size-4 animate-spin" />}
              Record Movement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

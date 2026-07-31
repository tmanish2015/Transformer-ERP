import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { productionOrderSchema, type ProductionOrderFormInput, type ProductionOrderFormValues } from '@/features/manufacturing/schemas/manufacturing-schemas'
import { useCreateProductionOrder } from '@/features/manufacturing/hooks/use-production-orders'
import { useBoms } from '@/features/manufacturing/hooks/use-boms'
import { useWarehouses } from '@/features/inventory/hooks/use-warehouses'

interface ProductionOrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductionOrderFormDialog({ open, onOpenChange }: ProductionOrderFormDialogProps) {
  const { data: boms } = useBoms()
  const { data: warehouses } = useWarehouses()
  const createOrder = useCreateProductionOrder()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductionOrderFormInput, unknown, ProductionOrderFormValues>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: { bom_id: '', quantity: 1, warehouse_id: '', notes: '' },
  })

  const onSubmit = (values: ProductionOrderFormValues) => {
    createOrder.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Production Order</DialogTitle>
          <DialogDescription>Raises an order from a BOM and computes raw material requirements.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>BOM</Label>
            <Controller
              control={control}
              name="bom_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select BOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {boms?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.product.name} — v{b.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.bom_id && <p className="text-xs text-destructive">{errors.bom_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" step="1" min="1" {...register('quantity')} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
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

          <div className="space-y-1.5">
            <Label htmlFor="order_notes">Notes</Label>
            <Textarea id="order_notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOrder.isPending}>
              {createOrder.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

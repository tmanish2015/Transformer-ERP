import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { rentalAssetSchema, type RentalAssetFormInput, type RentalAssetFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalAsset, useUpdateRentalAsset } from '@/features/rental/hooks/use-rental-assets'
import { useRentalAssetCategories } from '@/features/rental/hooks/use-rental-asset-categories'
import type { RentalAssetWithCategory } from '@/features/rental/types/rental-types'

interface RentalAssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: RentalAssetWithCategory | null
}

export function RentalAssetFormDialog({ open, onOpenChange, asset }: RentalAssetFormDialogProps) {
  const { data: categories } = useRentalAssetCategories()
  const createAsset = useCreateRentalAsset()
  const updateAsset = useUpdateRentalAsset()
  const isPending = createAsset.isPending || updateAsset.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalAssetFormInput, unknown, RentalAssetFormValues>({
    resolver: zodResolver(rentalAssetSchema),
    values: {
      category_id: asset?.category_id ?? '',
      name: asset?.name ?? '',
      serial_number: asset?.serial_number ?? '',
      current_location: asset?.current_location ?? '',
      purchase_cost: asset?.purchase_cost ?? undefined,
      daily_rental_rate: asset?.daily_rental_rate ?? 0,
      notes: asset?.notes ?? '',
    },
  })

  const onSubmit = (values: RentalAssetFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (asset) {
      updateAsset.mutate({ id: asset.id, values }, { onSuccess })
    } else {
      createAsset.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Rental Asset' : 'New Rental Asset'}</DialogTitle>
          <DialogDescription>Machines/equipment available for rental.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input id="serial_number" {...register('serial_number')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_location">Current Location</Label>
              <Input id="current_location" {...register('current_location')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="purchase_cost">Purchase Cost</Label>
              <Input id="purchase_cost" type="number" step="0.01" {...register('purchase_cost')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily_rental_rate">Daily Rental Rate</Label>
              <Input id="daily_rental_rate" type="number" step="0.01" {...register('daily_rental_rate')} />
              {errors.daily_rental_rate && <p className="text-xs text-destructive">{errors.daily_rental_rate.message}</p>}
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {asset ? 'Save changes' : 'Add asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RENTAL_ASSET_MANUAL_STATUSES, rentalAssetSchema, type RentalAssetFormInput, type RentalAssetFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalAsset, useUpdateRentalAsset } from '@/features/rental/hooks/use-rental-assets'
import { useRentalAssetCategories } from '@/features/rental/hooks/use-rental-asset-categories'
import { RENTAL_ASSET_STATUS_LABELS, type RentalAssetWithCategory } from '@/features/rental/types/rental-types'

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
      name: asset?.name ?? '',
      category_id: asset?.category_id ?? '',
      make: asset?.make ?? '',
      model: asset?.model ?? '',
      serial_number: asset?.serial_number ?? '',
      capacity: asset?.capacity ?? '',
      daily_rental_rate: asset?.daily_rental_rate ?? 0,
      monthly_rental_rate: asset?.monthly_rental_rate ?? 0,
      current_location: asset?.current_location ?? '',
      status: (asset?.status as RentalAssetFormValues['status']) ?? 'available',
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
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {asset && (
            <div className="space-y-1.5">
              <Label>Asset Code</Label>
              <Input value={asset.asset_code} disabled readOnly />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Machine / Asset Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  >
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
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="make">Make / Brand</Label>
              <Input id="make" {...register('make')} />
              {errors.make && <p className="text-xs text-destructive">{errors.make.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model No.</Label>
              <Input id="model" {...register('model')} />
              {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="serial_number">Serial No.</Label>
              <Input id="serial_number" {...register('serial_number')} />
              {errors.serial_number && <p className="text-xs text-destructive">{errors.serial_number.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity / Specification</Label>
              <Input id="capacity" {...register('capacity')} />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="daily_rental_rate">Rental Rate — Daily (₹)</Label>
              <Input id="daily_rental_rate" type="number" step="0.01" {...register('daily_rental_rate')} />
              {errors.daily_rental_rate && <p className="text-xs text-destructive">{errors.daily_rental_rate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthly_rental_rate">Rental Rate — Monthly (₹)</Label>
              <Input id="monthly_rental_rate" type="number" step="0.01" {...register('monthly_rental_rate')} />
              {errors.monthly_rental_rate && <p className="text-xs text-destructive">{errors.monthly_rental_rate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="current_location">Location</Label>
              <Input id="current_location" {...register('current_location')} />
              {errors.current_location && <p className="text-xs text-destructive">{errors.current_location.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'available')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RENTAL_ASSET_MANUAL_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {RENTAL_ASSET_STATUS_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { rentalDispatchSchema, type RentalDispatchFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalDispatch } from '@/features/rental/hooks/use-rental-dispatch'
import { useVehicles } from '@/features/logistics/hooks/use-vehicles'
import { useDrivers } from '@/features/logistics/hooks/use-drivers'

interface RentalDispatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agreementId: string
}

export function RentalDispatchDialog({ open, onOpenChange, agreementId }: RentalDispatchDialogProps) {
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const createDispatch = useCreateRentalDispatch(agreementId)

  const { register, control, handleSubmit, reset } = useForm<RentalDispatchFormValues>({
    resolver: zodResolver(rentalDispatchSchema),
    defaultValues: { vehicle_id: '', driver_id: '', dispatch_condition_notes: '' },
  })

  const onSubmit = (values: RentalDispatchFormValues) => {
    createDispatch.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Dispatch Asset</DialogTitle>
          <DialogDescription>Logs a delivery trip and moves the asset to running.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vehicle</Label>
            <Controller
              control={control}
              name="vehicle_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vehicle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registration_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Driver</Label>
            <Controller
              control={control}
              name="driver_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dispatch_condition_notes">Condition Notes</Label>
            <Textarea id="dispatch_condition_notes" rows={3} placeholder="Asset condition at dispatch" {...register('dispatch_condition_notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDispatch.isPending}>
              {createDispatch.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

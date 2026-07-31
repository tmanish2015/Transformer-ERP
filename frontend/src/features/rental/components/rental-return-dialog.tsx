import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { rentalReturnSchema, type RentalReturnFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalReturn } from '@/features/rental/hooks/use-rental-returns'
import { useVehicles } from '@/features/logistics/hooks/use-vehicles'
import { useDrivers } from '@/features/logistics/hooks/use-drivers'

interface RentalReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agreementId: string
}

export function RentalReturnDialog({ open, onOpenChange, agreementId }: RentalReturnDialogProps) {
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const createReturn = useCreateRentalReturn(agreementId)

  const { register, control, handleSubmit, reset } = useForm<RentalReturnFormValues>({
    resolver: zodResolver(rentalReturnSchema),
    defaultValues: { vehicle_id: '', driver_id: '', return_condition_notes: '' },
  })

  const onSubmit = (values: RentalReturnFormValues) => {
    createReturn.mutate(values, {
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
          <DialogTitle>Mark as Returned</DialogTitle>
          <DialogDescription>Logs a pickup trip and moves the asset to returned.</DialogDescription>
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
            <Label htmlFor="return_condition_notes">Condition Notes</Label>
            <Textarea id="return_condition_notes" rows={3} placeholder="Asset condition at pickup" {...register('return_condition_notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createReturn.isPending}>
              {createReturn.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

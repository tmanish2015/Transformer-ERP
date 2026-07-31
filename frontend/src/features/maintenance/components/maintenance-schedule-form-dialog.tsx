import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { maintenanceScheduleSchema, type MaintenanceScheduleFormInput, type MaintenanceScheduleFormValues } from '@/features/maintenance/schemas/maintenance-schemas'
import { useCreateMaintenanceSchedule } from '@/features/maintenance/hooks/use-maintenance-schedules'
import { useRentalAssets } from '@/features/rental/hooks/use-rental-assets'

interface MaintenanceScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MaintenanceScheduleFormDialog({ open, onOpenChange }: MaintenanceScheduleFormDialogProps) {
  const { data: assets } = useRentalAssets()
  const createSchedule = useCreateMaintenanceSchedule('rental_asset')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceScheduleFormInput, unknown, MaintenanceScheduleFormValues>({
    resolver: zodResolver(maintenanceScheduleSchema),
    defaultValues: { reference_id: '', frequency_days: 30, next_due_at: new Date().toISOString().slice(0, 10), notes: '' },
  })

  const onSubmit = (values: MaintenanceScheduleFormValues) => {
    createSchedule.mutate(values, {
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
          <DialogTitle>New Maintenance Schedule</DialogTitle>
          <DialogDescription>Recurring maintenance for a rental asset.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Asset</Label>
            <Controller
              control={control}
              name="reference_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.asset_code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reference_id && <p className="text-xs text-destructive">{errors.reference_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="frequency_days">Frequency (days)</Label>
              <Input id="frequency_days" type="number" min="1" {...register('frequency_days')} />
              {errors.frequency_days && <p className="text-xs text-destructive">{errors.frequency_days.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_due_at">Next Due</Label>
              <Input id="next_due_at" type="date" {...register('next_due_at')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule_notes">Notes</Label>
            <Textarea id="schedule_notes" rows={2} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSchedule.isPending}>
              {createSchedule.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { maintenanceVisitSchema, type MaintenanceVisitFormValues } from '@/features/maintenance/schemas/maintenance-schemas'
import { useCreateMaintenanceVisit, useVisitsForSchedule } from '@/features/maintenance/hooks/use-maintenance-visits'
import { MAINTENANCE_VISIT_STATUS_LABELS } from '@/features/maintenance/types/maintenance-types'

interface MaintenanceVisitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
}

export function MaintenanceVisitDialog({ open, onOpenChange, scheduleId }: MaintenanceVisitDialogProps) {
  const { data: visits } = useVisitsForSchedule(scheduleId)
  const createVisit = useCreateMaintenanceVisit(scheduleId)

  const { register, control, handleSubmit, reset } = useForm<MaintenanceVisitFormValues>({
    resolver: zodResolver(maintenanceVisitSchema),
    defaultValues: { visited_at: new Date().toISOString().slice(0, 10), status: 'completed', notes: '' },
  })

  const onSubmit = (values: MaintenanceVisitFormValues) => {
    createVisit.mutate(values, { onSuccess: () => reset({ visited_at: new Date().toISOString().slice(0, 10), status: 'completed', notes: '' }) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Maintenance Visits</DialogTitle>
          <DialogDescription>Log a visit — completing one advances the next due date.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="visited_at">Visit Date</Label>
              <Input id="visited_at" type="date" {...register('visited_at')} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MAINTENANCE_VISIT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visit_notes">Notes</Label>
            <Textarea id="visit_notes" rows={2} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createVisit.isPending}>
              {createVisit.isPending && <Loader2 className="size-4 animate-spin" />}
              Log Visit
            </Button>
          </DialogFooter>
        </form>

        {visits && visits.length > 0 && (
          <>
            <Separator />
            <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {visits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between">
                  <span className="text-foreground">{new Date(visit.visited_at).toLocaleDateString()}</span>
                  <StatusBadge status={visit.status} label={MAINTENANCE_VISIT_STATUS_LABELS[visit.status as keyof typeof MAINTENANCE_VISIT_STATUS_LABELS]} />
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

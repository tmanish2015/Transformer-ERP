import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { dailyAllocationSchema, type DailyAllocationFormValues } from '@/features/hr/schemas/hr-schemas'
import { useEmployees } from '@/features/hr/hooks/use-employees'
import { useCreateDailyAllocation } from '@/features/hr/hooks/use-daily-allocations'

interface AssignTechnicianDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referenceType: string
  referenceId: string
}

export function AssignTechnicianDialog({ open, onOpenChange, referenceType, referenceId }: AssignTechnicianDialogProps) {
  const { data: employees } = useEmployees()
  const createAllocation = useCreateDailyAllocation(referenceType, referenceId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DailyAllocationFormValues>({
    resolver: zodResolver(dailyAllocationSchema),
    defaultValues: { employee_id: '', allocation_date: new Date().toISOString().slice(0, 10), notes: '' },
  })

  const onSubmit = (values: DailyAllocationFormValues) => {
    createAllocation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  const activeEmployees = employees?.filter((e) => e.is_active) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>Records which technician is working this job on a given day.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Technician</Label>
            <Controller
              control={control}
              name="employee_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                        {e.role_title ? ` — ${e.role_title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employee_id && <p className="text-xs text-destructive">{errors.employee_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allocation_date">Date</Label>
            <Input id="allocation_date" type="date" {...register('allocation_date')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allocation_notes">Notes</Label>
            <Textarea id="allocation_notes" rows={2} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAllocation.isPending}>
              {createAllocation.isPending && <Loader2 className="size-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

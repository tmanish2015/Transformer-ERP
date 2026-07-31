import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { rentalInspectionSchema, type RentalInspectionFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalInspection } from '@/features/rental/hooks/use-rental-inspections'
import { RENTAL_CONDITION_RATING_LABELS } from '@/features/rental/types/rental-types'

interface RentalInspectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnId: string
}

export function RentalInspectionDialog({ open, onOpenChange, returnId }: RentalInspectionDialogProps) {
  const createInspection = useCreateRentalInspection(returnId)

  const { register, control, handleSubmit, reset } = useForm<RentalInspectionFormValues>({
    resolver: zodResolver(rentalInspectionSchema),
    defaultValues: { condition_rating: 'good', notes: '' },
  })

  const onSubmit = (values: RentalInspectionFormValues) => {
    createInspection.mutate(values, {
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
          <DialogTitle>Inspect Asset</DialogTitle>
          <DialogDescription>Damaged assets go to maintenance instead of back into the available pool.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Condition</Label>
            <Controller
              control={control}
              name="condition_rating"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RENTAL_CONDITION_RATING_LABELS).map(([value, label]) => (
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
            <Label htmlFor="inspection_notes">Notes</Label>
            <Textarea id="inspection_notes" rows={3} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInspection.isPending}>
              {createInspection.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Inspection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

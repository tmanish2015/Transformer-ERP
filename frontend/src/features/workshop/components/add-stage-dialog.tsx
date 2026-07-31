import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { stageHistorySchema, type StageHistoryFormValues } from '@/features/workshop/schemas/workshop-schemas'
import { REPAIR_STAGE_LABELS, REPAIR_STAGE_ORDER } from '@/features/workshop/types/workshop-types'
import { useAddStageHistoryEntry } from '@/features/workshop/hooks/use-repair-job-stages'

interface AddStageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairJobId: string
}

export function AddStageDialog({ open, onOpenChange, repairJobId }: AddStageDialogProps) {
  const addStage = useAddStageHistoryEntry(repairJobId)

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<StageHistoryFormValues>({
    resolver: zodResolver(stageHistorySchema),
    defaultValues: { stage: 'dismantling', notes: '' },
  })

  const onSubmit = (values: StageHistoryFormValues) => {
    addStage.mutate(values, {
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
          <DialogTitle>Log Repair Stage</DialogTitle>
          <DialogDescription>Record the transformer's progress to the next physical repair stage.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Controller
              control={control}
              name="stage"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAIR_STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {REPAIR_STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.stage && <p className="text-xs text-destructive">{errors.stage.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stage_notes">Notes</Label>
            <Textarea id="stage_notes" rows={3} placeholder="Optional remarks" {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addStage.isPending}>
              {addStage.isPending && <Loader2 className="size-4 animate-spin" />}
              Log Stage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

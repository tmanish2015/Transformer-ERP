import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useMarkPickupCompleted } from '@/features/workshop/hooks/use-repair-jobs'

interface MarkPickupCompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairJobId: string
}

export function MarkPickupCompleteDialog({ open, onOpenChange, repairJobId }: MarkPickupCompleteDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const markComplete = useMarkPickupCompleted()

  const onConfirm = () => {
    markComplete.mutate({ id: repairJobId, pickupCompletedDate: date }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark Pickup Complete</DialogTitle>
          <DialogDescription>Confirms the transformer has been collected from the customer site and moves the job to inspection.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="pickup_completed_date">Pickup Date</Label>
          <Input id="pickup_completed_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={markComplete.isPending} onClick={onConfirm}>
            {markComplete.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { siteSurveyCompletionSchema, type SiteSurveyCompletionFormValues } from '@/features/crm/schemas/crm-schemas'
import { useCompleteSiteSurvey } from '@/features/crm/hooks/use-site-surveys'

interface CompleteSiteSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteSurveyId: string
}

export function CompleteSiteSurveyDialog({ open, onOpenChange, siteSurveyId }: CompleteSiteSurveyDialogProps) {
  const completeSurvey = useCompleteSiteSurvey(siteSurveyId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteSurveyCompletionFormValues>({
    resolver: zodResolver(siteSurveyCompletionSchema),
    defaultValues: { conducted_date: new Date().toISOString().slice(0, 10), findings: '' },
  })

  const onSubmit = (values: SiteSurveyCompletionFormValues) => {
    completeSurvey.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Site Survey</DialogTitle>
          <DialogDescription>Log what was found during the visit.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="conducted_date">Conducted Date</Label>
            <Input id="conducted_date" type="date" {...register('conducted_date')} />
            {errors.conducted_date && <p className="text-xs text-destructive">{errors.conducted_date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="findings">Findings</Label>
            <Textarea id="findings" rows={4} {...register('findings')} />
            {errors.findings && <p className="text-xs text-destructive">{errors.findings.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={completeSurvey.isPending}>
              {completeSurvey.isPending && <Loader2 className="size-4 animate-spin" />}
              Mark Completed
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

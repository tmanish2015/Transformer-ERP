import { CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { useStageHistory } from '@/features/workshop/hooks/use-repair-job-stages'
import { REPAIR_STAGE_LABELS } from '@/features/workshop/types/workshop-types'

interface StageTimelineProps {
  repairJobId: string
}

export function StageTimeline({ repairJobId }: StageTimelineProps) {
  const { data: history, isLoading } = useStageHistory(repairJobId)

  if (isLoading) return <Skeleton className="h-24 w-full" />

  if (!history || history.length === 0) {
    return <EmptyState icon={CheckCircle2} title="No stages logged yet" description="Log the first stage once the job moves past customer approval." />
  }

  return (
    <ol className="space-y-4">
      {history.map((entry, index) => (
        <li key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-chart-success/10 text-chart-success">
              <CheckCircle2 className="size-4" />
            </span>
            {index < history.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="pb-2">
            <p className="text-sm font-medium text-foreground">{REPAIR_STAGE_LABELS[entry.stage as keyof typeof REPAIR_STAGE_LABELS]}</p>
            <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
            {entry.notes && <p className="mt-1 text-sm text-foreground">{entry.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

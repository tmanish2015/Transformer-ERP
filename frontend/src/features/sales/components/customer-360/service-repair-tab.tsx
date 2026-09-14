import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, IndianRupee, Wrench } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { KpiCard } from '@/components/shared/kpi-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer360RepairEstimates } from '@/features/sales/hooks/use-customer-360'
import { REPAIR_JOB_STATUS_LABELS, type RepairJob } from '@/features/workshop/types/workshop-types'

interface ServiceRepairTabProps {
  customerId: string
  active: boolean
  repairJobs: RepairJob[] | undefined
}

export function ServiceRepairTab({ customerId, active, repairJobs }: ServiceRepairTabProps) {
  const navigate = useNavigate()
  const { data: estimates } = useCustomer360RepairEstimates(customerId, active)

  const stats = useMemo(() => {
    const open = (repairJobs ?? []).filter((j) => !['completed', 'cancelled'].includes(j.status)).length
    const completed = (repairJobs ?? []).filter((j) => j.status === 'completed').length
    const estimateValue = (estimates ?? []).filter((e) => e.status === 'customer_approved').reduce((s, e) => s + e.total, 0)
    return { open, completed, estimateValue }
  }, [repairJobs, estimates])

  if (!repairJobs) return <Skeleton className="h-64 w-full rounded-xl" />

  if (repairJobs.length === 0) {
    return <EmptyState icon={Wrench} title="No repair history" description="This customer has no service or repair jobs on record." />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Open Repairs" value={String(stats.open)} icon={ClipboardList} tone={stats.open > 0 ? 'warning' : 'default'} />
        <KpiCard label="Completed Repairs" value={String(stats.completed)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Approved Estimate Value" value={`₹${stats.estimateValue.toLocaleString('en-IN')}`} icon={IndianRupee} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3 text-sm font-medium text-foreground">Repair Jobs</div>
        <div className="divide-y divide-border">
          {repairJobs.map((job) => (
            <button key={job.id} type="button" onClick={() => navigate(`/workshop/jobs/${job.id}`)} className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50">
              <span className="text-foreground">{job.job_number}</span>
              <span className="text-muted-foreground">{[job.transformer_make, job.transformer_model].filter(Boolean).join(' ') || 'Not available'}</span>
              <StatusBadge status={job.status} label={REPAIR_JOB_STATUS_LABELS[job.status as keyof typeof REPAIR_JOB_STATUS_LABELS] ?? job.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

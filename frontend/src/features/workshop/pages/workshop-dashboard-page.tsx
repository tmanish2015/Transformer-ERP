import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { AlertCircle, ClipboardList, FileText, Truck, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useRepairJobs } from '@/features/workshop/hooks/use-repair-jobs'
import { useRepairEstimates } from '@/features/workshop/hooks/use-repair-estimates'
import { REPAIR_JOB_STATUS_LABELS } from '@/features/workshop/types/workshop-types'
import { categoricalColor, statusColor } from '@/lib/chart-colors'

const estimateValueChartConfig = {
  value: { label: 'Estimate Value (₹)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function WorkshopDashboardPage() {
  const { data: jobs, isLoading: jobsLoading } = useRepairJobs()
  const { data: estimates, isLoading: estimatesLoading } = useRepairEstimates()

  const isLoading = jobsLoading || estimatesLoading

  const stats = useMemo(() => {
    const allJobs = jobs ?? []
    const openJobs = allJobs.filter((j) => !['completed', 'cancelled'].includes(j.status)).length
    const pendingPickups = allJobs.filter((j) => j.pickup_required && !j.pickup_completed_date).length
    const awaitingApproval = (estimates ?? []).filter((e) => e.status === 'sent').length
    const inProgress = allJobs.filter((j) => j.status === 'in_progress').length
    return { totalJobs: allJobs.length, openJobs, pendingPickups, awaitingApproval, inProgress }
  }, [jobs, estimates])

  const jobStatusData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const j of jobs ?? []) counts.set(j.status, (counts.get(j.status) ?? 0) + 1)
    return [...counts.entries()].map(([status, count]) => ({ status: REPAIR_JOB_STATUS_LABELS[status as keyof typeof REPAIR_JOB_STATUS_LABELS] ?? status, rawStatus: status, count }))
  }, [jobs])

  const topEstimateJobs = useMemo(() => {
    return [...(estimates ?? [])]
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((e) => ({ job: e.repair_job.job_number, value: Math.round(e.total) }))
  }, [estimates])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workshop Dashboard"
        description="Overview of repair job cards, inspections, and estimates."
        actions={
          <Button render={<Link to="/workshop/jobs" />} nativeButton={false}>
            <Wrench /> View Job Cards
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Total Job Cards" value={String(stats.totalJobs)} icon={ClipboardList} />
            <KpiCard label="Open Jobs" value={String(stats.openJobs)} icon={Wrench} tone={stats.openJobs > 0 ? 'warning' : 'default'} />
            <KpiCard label="Pending Pickups" value={String(stats.pendingPickups)} icon={Truck} tone={stats.pendingPickups > 0 ? 'destructive' : 'default'} />
            <KpiCard label="Estimates Awaiting Approval" value={String(stats.awaitingApproval)} icon={FileText} tone={stats.awaitingApproval > 0 ? 'warning' : 'default'} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Estimates by Value</CardTitle>
            <CardDescription>Highest-value repair estimates raised</CardDescription>
          </CardHeader>
          <CardContent>
            {topEstimateJobs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No estimates yet.</p>
            ) : (
              <ChartContainer config={estimateValueChartConfig} className="h-52 w-full">
                <BarChart data={topEstimateJobs}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="job" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {topEstimateJobs.map((entry, index) => (
                      <Cell key={entry.job} fill={categoricalColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Job Status</CardTitle>
          </CardHeader>
          <CardContent>
            {jobStatusData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={{}} className="mx-auto aspect-square h-48">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={jobStatusData} dataKey="count" nameKey="status" innerRadius={45}>
                    {jobStatusData.map((entry) => (
                      <Cell key={entry.rawStatus} fill={statusColor(entry.rawStatus)} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.pendingPickups > 0 && (
        <Card size="sm" className="border-chart-warning/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="size-5 text-chart-warning" />
            <p className="text-sm text-foreground">
              {stats.pendingPickups} job{stats.pendingPickups > 1 ? 's' : ''} waiting on transformer pickup from the customer site.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

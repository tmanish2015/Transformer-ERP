import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Clock, ListChecks } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useRepairJobs } from '@/features/workshop/hooks/use-repair-jobs'
import { useAllStageHistory } from '@/features/workshop/hooks/use-repair-job-stages'
import { useAllAllocations } from '@/features/hr/hooks/use-daily-allocations'

const tatChartConfig = {
  days: { label: 'Turnaround (days)', color: 'var(--chart-1)' },
} satisfies ChartConfig

const productivityChartConfig = {
  total: { label: 'Assignments', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function WorkshopReportsPage() {
  const { data: jobs } = useRepairJobs()
  const { data: stageHistory } = useAllStageHistory()
  const { data: allocations } = useAllAllocations()

  const tatRows = useMemo(() => {
    const installationByJob = new Map<string, string>()
    for (const entry of stageHistory ?? []) {
      if (entry.stage === 'installation' && !installationByJob.has(entry.repair_job_id)) {
        installationByJob.set(entry.repair_job_id, entry.created_at)
      }
    }
    return (jobs ?? [])
      .filter((j) => installationByJob.has(j.id))
      .map((j) => {
        const installedAt = installationByJob.get(j.id)!
        const hours = (new Date(installedAt).getTime() - new Date(j.created_at).getTime()) / (1000 * 60 * 60)
        return { job: j.job_number, customer: j.customer.name, days: Math.round((hours / 24) * 10) / 10 }
      })
      .sort((a, b) => b.days - a.days)
  }, [jobs, stageHistory])

  const avgTatDays = tatRows.length > 0 ? tatRows.reduce((sum, r) => sum + r.days, 0) / tatRows.length : 0

  const productivityRows = useMemo(() => {
    const jobStatusById = new Map((jobs ?? []).map((j) => [j.id, j.status]))
    const counts = new Map<string, { name: string; total: number; completed: number }>()
    for (const allocation of allocations ?? []) {
      const existing = counts.get(allocation.employee_id) ?? { name: allocation.employee.name, total: 0, completed: 0 }
      existing.total += 1
      if (allocation.reference_type === 'repair_job' && jobStatusById.get(allocation.reference_id) === 'completed') {
        existing.completed += 1
      }
      counts.set(allocation.employee_id, existing)
    }
    return [...counts.values()].sort((a, b) => b.total - a.total)
  }, [allocations, jobs])

  return (
    <div className="space-y-6">
      <PageHeader title="Workshop Reports" description="Repair turnaround time and technician productivity." />

      <Tabs defaultValue="tat">
        <TabsList>
          <TabsTrigger value="tat">Repair TAT</TabsTrigger>
          <TabsTrigger value="productivity">Engineer Productivity</TabsTrigger>
        </TabsList>

        <TabsContent value="tat" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard label="Avg. Turnaround" value={`${avgTatDays.toFixed(1)} days`} icon={Clock} />
            <KpiCard label="Jobs Completed" value={String(tatRows.length)} icon={ListChecks} />
          </div>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Turnaround by Job</CardTitle>
              <CardDescription>Time from job intake to the installation stage being logged</CardDescription>
            </CardHeader>
            <CardContent>
              {tatRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No completed jobs yet.</p>
              ) : (
                <ChartContainer config={tatChartConfig} className="h-52 w-full">
                  <BarChart data={tatRows.slice(0, 12)}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="job" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="days" fill="var(--color-days)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Turnaround (days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tatRows.map((row) => (
                    <TableRow key={row.job}>
                      <TableCell className="font-medium text-foreground">{row.job}</TableCell>
                      <TableCell className="text-muted-foreground">{row.customer}</TableCell>
                      <TableCell className="text-right">{row.days}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Assignments by Technician</CardTitle>
              <CardDescription>Total day-level job/task assignments across all repair jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {productivityRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No technicians assigned yet.</p>
              ) : (
                <ChartContainer config={productivityChartConfig} className="h-52 w-full">
                  <BarChart data={productivityRows}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead className="text-right">Total Assignments</TableHead>
                    <TableHead className="text-right">Completed Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productivityRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                      <TableCell className="text-right">{row.total}</TableCell>
                      <TableCell className="text-right">{row.completed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

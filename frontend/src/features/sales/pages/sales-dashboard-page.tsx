import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { AlertCircle, FileText, IndianRupee, Percent, Target, TrendingUp, Truck } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useQuotations } from '@/features/sales/hooks/use-quotations'
import { useSalesOrders } from '@/features/sales/hooks/use-sales-orders'
import { useSalesInvoices } from '@/features/sales/hooks/use-sales-invoices'
import { QUOTATION_STATUS_LABELS, SO_STATUS_LABELS, outstandingAmount } from '@/features/sales/types/sales-types'
import { categoricalColor, statusColor } from '@/lib/chart-colors'

const trendChartConfig = {
  value: { label: 'Sales (₹)', color: 'var(--chart-success)' },
} satisfies ChartConfig

const barChartConfig = {
  value: { label: 'Revenue (₹)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function SalesDashboardPage() {
  const { data: quotations, isLoading: quotationsLoading } = useQuotations()
  const { data: orders, isLoading: ordersLoading } = useSalesOrders()
  const { data: invoices, isLoading: invoicesLoading } = useSalesInvoices()

  const isLoading = quotationsLoading || ordersLoading || invoicesLoading

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonthInvoices = (invoices ?? []).filter((inv) => {
      const d = new Date(inv.invoice_date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const totalSalesThisMonth = thisMonthInvoices.reduce((sum, inv) => sum + inv.total, 0)

    const openQuotations = (quotations ?? []).filter((q) => ['draft', 'pending_approval', 'approved', 'sent'].includes(q.status)).length
    const openOrders = (orders ?? []).filter((so) => ['confirmed', 'partially_delivered'].includes(so.status)).length
    const pendingDeliveries = (orders ?? []).filter((so) => so.status === 'confirmed').length

    const outstandingInvoices = (invoices ?? []).filter((inv) => inv.status !== 'paid')
    const totalReceivables = outstandingInvoices.reduce((sum, inv) => sum + outstandingAmount(inv), 0)
    const overdueAmount = outstandingInvoices.filter((inv) => inv.due_date && new Date(inv.due_date).getTime() < Date.now()).reduce((sum, inv) => sum + outstandingAmount(inv), 0)

    const avgOrderValue = (orders ?? []).length > 0 ? (orders ?? []).reduce((sum, so) => sum + so.total, 0) / (orders ?? []).length : 0

    const decidedQuotations = (quotations ?? []).filter((q) => ['accepted', 'rejected'].includes(q.status))
    const acceptedQuotations = decidedQuotations.filter((q) => q.status === 'accepted')
    const conversionRate = decidedQuotations.length > 0 ? Math.round((acceptedQuotations.length / decidedQuotations.length) * 100) : 0

    return { totalSalesThisMonth, openQuotations, openOrders, pendingDeliveries, totalReceivables, overdueAmount, avgOrderValue, conversionRate }
  }, [quotations, orders, invoices])

  const salesTrend = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-IN', { month: 'short' }), value: 0 })
    }
    const byKey = new Map(months.map((m) => [m.key, m]))
    for (const inv of invoices ?? []) {
      const d = new Date(inv.invoice_date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const month = byKey.get(key)
      if (month) month.value += inv.total
    }
    return months.map((m) => ({ month: m.label, value: Math.round(m.value) }))
  }, [invoices])

  const topCustomers = useMemo(() => {
    const totals = new Map<string, number>()
    for (const inv of invoices ?? []) {
      totals.set(inv.customer.name, (totals.get(inv.customer.name) ?? 0) + inv.total)
    }
    return [...totals.entries()]
      .map(([customer, value]) => ({ customer, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [invoices])

  const quotationStatusData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const q of quotations ?? []) counts.set(q.status, (counts.get(q.status) ?? 0) + 1)
    return [...counts.entries()].map(([status, count]) => ({ status: QUOTATION_STATUS_LABELS[status as keyof typeof QUOTATION_STATUS_LABELS] ?? status, rawStatus: status, count }))
  }, [quotations])

  const soStatusData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const so of orders ?? []) counts.set(so.status, (counts.get(so.status) ?? 0) + 1)
    return [...counts.entries()].map(([status, count]) => ({ status: SO_STATUS_LABELS[status as keyof typeof SO_STATUS_LABELS] ?? status, rawStatus: status, count }))
  }, [orders])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Dashboard"
        description="Overview of quotations, orders, invoicing, and receivables."
        actions={
          <Button render={<Link to="/sales/orders" />} nativeButton={false}>
            <FileText /> View Sales Orders
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Sales This Month" value={`₹${stats.totalSalesThisMonth.toLocaleString('en-IN')}`} icon={IndianRupee} />
            <KpiCard label="Open Quotations" value={String(stats.openQuotations)} icon={FileText} />
            <KpiCard label="Open Sales Orders" value={String(stats.openOrders)} icon={Target} />
            <KpiCard label="Pending Deliveries" value={String(stats.pendingDeliveries)} icon={Truck} tone={stats.pendingDeliveries > 0 ? 'warning' : 'default'} />
            <KpiCard label="Total Receivables" value={`₹${stats.totalReceivables.toLocaleString('en-IN')}`} icon={IndianRupee} />
            <KpiCard label="Overdue Amount" value={`₹${stats.overdueAmount.toLocaleString('en-IN')}`} icon={AlertCircle} tone={stats.overdueAmount > 0 ? 'destructive' : 'default'} />
            <KpiCard label="Avg Order Value" value={`₹${Math.round(stats.avgOrderValue).toLocaleString('en-IN')}`} icon={TrendingUp} />
            <KpiCard label="Quotation Win Rate" value={`${stats.conversionRate}%`} icon={Percent} tone={stats.conversionRate >= 50 ? 'success' : 'default'} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sales Trend</CardTitle>
            <CardDescription>Invoiced revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {salesTrend.every((m) => m.value === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No invoice data yet.</p>
            ) : (
              <ChartContainer config={trendChartConfig} className="h-52 w-full">
                <LineChart data={salesTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Quotation Status</CardTitle>
          </CardHeader>
          <CardContent>
            {quotationStatusData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={{}} className="mx-auto aspect-square h-48">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={quotationStatusData} dataKey="count" nameKey="status" innerRadius={45}>
                    {quotationStatusData.map((entry) => (
                      <Cell key={entry.rawStatus} fill={statusColor(entry.rawStatus)} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={barChartConfig} className="h-52 w-full">
                <BarChart data={topCustomers}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="customer" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {topCustomers.map((entry, index) => (
                      <Cell key={entry.customer} fill={categoricalColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Sales Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {soStatusData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={{}} className="mx-auto aspect-square h-48">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={soStatusData} dataKey="count" nameKey="status" innerRadius={45}>
                    {soStatusData.map((entry) => (
                      <Cell key={entry.rawStatus} fill={statusColor(entry.rawStatus)} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

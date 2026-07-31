import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { AlertCircle, FileClock, IndianRupee, ShoppingCart } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { usePurchaseOrders } from '@/features/purchases/hooks/use-purchase-orders'
import { usePurchaseBills } from '@/features/purchases/hooks/use-purchase-bills'
import { PO_STATUS_LABELS, isBillOverdue } from '@/features/purchases/types/purchase-types'
import { categoricalColor, statusColor } from '@/lib/chart-colors'

const supplierChartConfig = {
  value: { label: 'Spend (₹)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function PurchaseDashboardPage() {
  const { data: orders, isLoading: ordersLoading } = usePurchaseOrders()
  const { data: bills, isLoading: billsLoading } = usePurchaseBills()

  const stats = useMemo(() => {
    const activeOrders = (orders ?? []).filter((po) => !['received', 'cancelled'].includes(po.status))
    const pendingApproval = (orders ?? []).filter((po) => po.status === 'pending_approval')
    const totalSpend = (orders ?? []).filter((po) => po.status !== 'cancelled').reduce((sum, po) => sum + po.total, 0)
    const overdueBills = (bills ?? []).filter((bill) => isBillOverdue(bill))
    const overdueAmount = overdueBills.reduce((sum, bill) => sum + (bill.total - bill.amount_paid), 0)

    return {
      openOrders: activeOrders.length,
      pendingApprovalCount: pendingApproval.length,
      totalSpend,
      overdueCount: overdueBills.length,
      overdueAmount,
    }
  }, [orders, bills])

  const supplierChartData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const po of orders ?? []) {
      if (po.status === 'cancelled') continue
      totals.set(po.supplier.name, (totals.get(po.supplier.name) ?? 0) + po.total)
    }
    return [...totals.entries()]
      .map(([supplier, value]) => ({ supplier, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [orders])

  const statusChartData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const po of orders ?? []) {
      counts.set(po.status, (counts.get(po.status) ?? 0) + 1)
    }
    return [...counts.entries()].map(([status, count]) => ({
      status: PO_STATUS_LABELS[status as keyof typeof PO_STATUS_LABELS] ?? status,
      rawStatus: status,
      count,
    }))
  }, [orders])

  const recentOrders = (orders ?? []).slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Dashboard"
        description="Overview of purchase orders, spend, and outstanding bills."
        actions={
          <Button render={<Link to="/purchases/orders" />} nativeButton={false}>
            <ShoppingCart /> View Orders
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ordersLoading || billsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Open Purchase Orders" value={String(stats.openOrders)} icon={ShoppingCart} />
            <KpiCard label="Pending Approvals" value={String(stats.pendingApprovalCount)} icon={FileClock} tone={stats.pendingApprovalCount > 0 ? 'warning' : 'default'} />
            <KpiCard label="Total Purchase Spend" value={`₹${stats.totalSpend.toLocaleString('en-IN')}`} icon={IndianRupee} />
            <KpiCard label="Overdue Bills" value={String(stats.overdueCount)} icon={AlertCircle} tone={stats.overdueCount > 0 ? 'destructive' : 'default'} description={`₹${stats.overdueAmount.toLocaleString('en-IN')} outstanding`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spend by Supplier</CardTitle>
            <CardDescription>Total purchase order value by supplier</CardDescription>
          </CardHeader>
          <CardContent>
            {supplierChartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={supplierChartConfig} className="h-52 w-full">
                <BarChart data={supplierChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="supplier" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {supplierChartData.map((entry, index) => (
                      <Cell key={entry.supplier} fill={categoricalColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">PO Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={{}} className="mx-auto aspect-square h-48">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={statusChartData} dataKey="count" nameKey="status" innerRadius={45}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.rawStatus} fill={statusColor(entry.rawStatus)} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentOrders.length === 0 && <p className="text-sm text-muted-foreground">No purchase orders yet.</p>}
          {recentOrders.map((po) => (
            <div key={po.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {po.po_number} · {po.supplier.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(po.order_date).toLocaleDateString()} · ₹{po.total.toLocaleString('en-IN')}
                </p>
              </div>
              <StatusBadge status={po.status} label={PO_STATUS_LABELS[po.status as keyof typeof PO_STATUS_LABELS]} />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" render={<Link to="/purchases/orders" />} nativeButton={false}>
            View all purchase orders
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

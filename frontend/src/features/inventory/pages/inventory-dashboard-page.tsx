import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Clock, IndianRupee, Package } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useProducts } from '@/features/inventory/hooks/use-products'
import { useMovements, useBatches } from '@/features/inventory/hooks/use-stock'
import { getStockStatus, MOVEMENT_TYPE_LABELS } from '@/features/inventory/types/inventory-types'
import { categoricalColor } from '@/lib/chart-colors'

const STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

const movementChartConfig = {
  inbound: { label: 'Inbound', color: 'var(--chart-success)' },
  outbound: { label: 'Outbound', color: 'var(--chart-info)' },
} satisfies ChartConfig

const categoryChartConfig = {
  value: { label: 'Stock Value (₹)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function InventoryDashboardPage() {
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: movements, isLoading: movementsLoading } = useMovements()
  const { data: batches } = useBatches()

  const stats = useMemo(() => {
    const activeProducts = (products ?? []).filter((p) => p.is_active)
    const totalStockValue = activeProducts.reduce((sum, p) => sum + p.total_stock * p.purchase_price, 0)
    const lowStock = activeProducts.filter((p) => getStockStatus(p.total_stock, p.reorder_level) === 'low_stock')
    const outOfStock = activeProducts.filter((p) => getStockStatus(p.total_stock, p.reorder_level) === 'out_of_stock')
    const expiringBatches = (batches ?? []).filter((b) => {
      if (!b.expiry_date) return false
      const days = Math.floor((new Date(b.expiry_date).getTime() - Date.now()) / 86_400_000)
      return days >= 0 && days <= 60
    })

    return {
      totalProducts: activeProducts.length,
      totalStockValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      expiringBatchesCount: expiringBatches.length,
      lowStockList: [...lowStock, ...outOfStock].sort((a, b) => a.total_stock - b.total_stock).slice(0, 5),
    }
  }, [products, batches])

  const categoryChartData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const p of products ?? []) {
      const key = p.category?.name ?? 'Uncategorized'
      totals.set(key, (totals.get(key) ?? 0) + p.total_stock * p.purchase_price)
    }
    return [...totals.entries()]
      .map(([category, value]) => ({ category, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [products])

  const movementTrendData = useMemo(() => {
    const days: { date: string; inbound: number; outbound: number }[] = []
    const byDate = new Map<string, { inbound: number; outbound: number }>()

    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      byDate.set(key, { inbound: 0, outbound: 0 })
    }

    for (const m of movements ?? []) {
      const key = new Date(m.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      const entry = byDate.get(key)
      if (!entry) continue
      if (m.quantity >= 0) entry.inbound += m.quantity
      else entry.outbound += Math.abs(m.quantity)
    }

    for (const [date, values] of byDate) {
      days.push({ date, ...values })
    }
    return days
  }, [movements])

  const recentMovements = (movements ?? []).slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Dashboard"
        description="Real-time overview of stock, value, and movement across your business."
        actions={
          <Button render={<Link to="/inventory/products" />} nativeButton={false}>
            <Package /> View Products
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {productsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Total Products" value={String(stats.totalProducts)} icon={Package} />
            <KpiCard label="Total Stock Value" value={`₹${stats.totalStockValue.toLocaleString('en-IN')}`} icon={IndianRupee} />
            <KpiCard
              label="Low Stock Alerts"
              value={String(stats.lowStockCount + stats.outOfStockCount)}
              icon={AlertTriangle}
              tone="warning"
              description={`${stats.outOfStockCount} out of stock`}
            />
            <KpiCard
              label="Batches Expiring Soon"
              value={String(stats.expiringBatchesCount)}
              icon={Clock}
              tone={stats.expiringBatchesCount > 0 ? 'warning' : 'default'}
              description="Within 60 days"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Stock Movement Trend</CardTitle>
            <CardDescription>Inbound vs outbound quantity, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ChartContainer config={movementChartConfig} className="h-52 w-full">
                <AreaChart data={movementTrendData}>
                  <defs>
                    <linearGradient id="fillInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-inbound)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-inbound)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-outbound)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-outbound)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="inbound" type="monotone" fill="url(#fillInbound)" stroke="var(--color-inbound)" strokeWidth={2} />
                  <Area dataKey="outbound" type="monotone" fill="url(#fillOutbound)" stroke="var(--color-outbound)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Watchlist</CardTitle>
            <CardDescription>Products needing attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.lowStockList.length === 0 && <p className="text-sm text-muted-foreground">Everything is well stocked.</p>}
            {stats.lowStockList.map((p) => {
              const status = getStockStatus(p.total_stock, p.reorder_level)
              return (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.total_stock} / {p.reorder_level} {p.unit.short_code}
                    </p>
                  </div>
                  <StatusBadge status={status} label={STATUS_LABELS[status]} />
                </div>
              )
            })}
            {stats.lowStockList.length > 0 && (
              <Button variant="outline" size="sm" className="w-full" render={<Link to="/inventory/stock-levels" />} nativeButton={false}>
                View stock levels
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMovements.length === 0 && <p className="text-sm text-muted-foreground">No movements recorded yet.</p>}
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{m.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.warehouse.name} · {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.movement_type} label={MOVEMENT_TYPE_LABELS[m.movement_type] ?? m.movement_type} />
                  <span className={m.quantity >= 0 ? 'text-sm font-medium text-chart-success' : 'text-sm font-medium text-chart-critical'}>
                    {m.quantity >= 0 ? '+' : ''}
                    {m.quantity}
                  </span>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" render={<Link to="/inventory/movements" />} nativeButton={false}>
              View full history
            </Button>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Stock Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={categoryChartConfig} className="h-48 w-full">
                <BarChart data={categoryChartData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} hide />
                  <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={100} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={entry.category} fill={categoricalColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

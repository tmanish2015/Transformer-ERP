import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart } from 'recharts'
import { CalendarCheck, MessageSquareText, Truck, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { useRentalInquiries } from '@/features/rental/hooks/use-rental-inquiries'
import { useRentalBookings } from '@/features/rental/hooks/use-rental-bookings'
import { RENTAL_ASSET_STATUS_LABELS } from '@/features/rental/types/rental-types'
import { statusColor } from '@/lib/chart-colors'

export function RentalDashboardPage() {
  const { data: assets, isLoading: assetsLoading } = useRentalAssets()
  const { data: inquiries, isLoading: inquiriesLoading } = useRentalInquiries()
  const { data: bookings, isLoading: bookingsLoading } = useRentalBookings()

  const isLoading = assetsLoading || inquiriesLoading || bookingsLoading

  const stats = useMemo(() => {
    const allAssets = assets ?? []
    const available = allAssets.filter((a) => a.status === 'available').length
    const outOnRent = allAssets.filter((a) => ['dispatched', 'running'].includes(a.status)).length
    const openInquiries = (inquiries ?? []).filter((i) => i.status === 'open').length
    const activeBookings = (bookings ?? []).filter((b) => b.status === 'confirmed').length
    return { total: allAssets.length, available, outOnRent, openInquiries, activeBookings }
  }, [assets, inquiries, bookings])

  const assetStatusData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of assets ?? []) counts.set(a.status, (counts.get(a.status) ?? 0) + 1)
    return [...counts.entries()].map(([status, count]) => ({ status: RENTAL_ASSET_STATUS_LABELS[status as keyof typeof RENTAL_ASSET_STATUS_LABELS] ?? status, rawStatus: status, count }))
  }, [assets])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rental Dashboard"
        description="Fleet availability, inquiries, and bookings."
        actions={
          <Button render={<Link to="/rental/assets" />} nativeButton={false}>
            <Truck /> View Assets
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Total Assets" value={String(stats.total)} icon={Truck} />
            <KpiCard label="Available Now" value={String(stats.available)} icon={CalendarCheck} tone={stats.available > 0 ? 'success' : 'default'} />
            <KpiCard label="Out on Rent" value={String(stats.outOnRent)} icon={Wrench} />
            <KpiCard label="Open Inquiries" value={String(stats.openInquiries)} icon={MessageSquareText} tone={stats.openInquiries > 0 ? 'warning' : 'default'} />
          </>
        )}
      </div>

      <Card size="sm" className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Asset Status</CardTitle>
        </CardHeader>
        <CardContent>
          {assetStatusData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No assets yet.</p>
          ) : (
            <ChartContainer config={{}} className="mx-auto aspect-square h-48">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={assetStatusData} dataKey="count" nameKey="status" innerRadius={45}>
                  {assetStatusData.map((entry) => (
                    <Cell key={entry.rawStatus} fill={statusColor(entry.rawStatus)} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

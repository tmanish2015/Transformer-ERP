import { useMemo } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays } from 'lucide-react'
import { useRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { useRentalBookings } from '@/features/rental/hooks/use-rental-bookings'
import { useRentalAgreements } from '@/features/rental/hooks/use-rental-agreements'

const WINDOW_DAYS = 30

function toDateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function RentalAvailabilityPage() {
  const { data: assets, isLoading: assetsLoading } = useRentalAssets()
  const { data: bookings, isLoading: bookingsLoading } = useRentalBookings()
  const { data: agreements, isLoading: agreementsLoading } = useRentalAgreements()

  const isLoading = assetsLoading || bookingsLoading || agreementsLoading

  const days = useMemo(() => {
    const today = toDateOnly(new Date())
    return Array.from({ length: WINDOW_DAYS }, (_, i) => today + i * 86400000)
  }, [])

  const occupiedByAsset = useMemo(() => {
    const map = new Map<string, { from: number; to: number; kind: 'booked' | 'active' }[]>()
    for (const booking of bookings ?? []) {
      if (booking.status !== 'confirmed') continue
      const list = map.get(booking.rental_asset_id) ?? []
      list.push({ from: toDateOnly(new Date(booking.start_date)), to: toDateOnly(new Date(booking.end_date)), kind: 'booked' })
      map.set(booking.rental_asset_id, list)
    }
    for (const agreement of agreements ?? []) {
      if (agreement.status !== 'active') continue
      const list = map.get(agreement.rental_asset_id) ?? []
      list.push({ from: toDateOnly(new Date(agreement.start_date)), to: toDateOnly(new Date(agreement.end_date)), kind: 'active' })
      map.set(agreement.rental_asset_id, list)
    }
    return map
  }, [bookings, agreements])

  return (
    <div className="space-y-6">
      <PageHeader title="Rental Availability" description={`Next ${WINDOW_DAYS} days, per asset.`} />

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !assets || assets.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No rental assets yet" />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div className="flex items-center border-b border-border pb-2">
                  <div className="w-48 shrink-0 text-xs font-medium text-muted-foreground">Asset</div>
                  {days.map((day) => (
                    <div key={day} className="w-8 shrink-0 text-center text-[10px] text-muted-foreground">
                      {new Date(day).getDate()}
                    </div>
                  ))}
                </div>
                {assets.map((asset) => {
                  const ranges = occupiedByAsset.get(asset.id) ?? []
                  return (
                    <div key={asset.id} className="flex items-center border-b border-border/50 py-1.5">
                      <div className="w-48 shrink-0 truncate text-sm text-foreground">
                        {asset.asset_code} — {asset.name}
                      </div>
                      {days.map((day) => {
                        const match = ranges.find((r) => day >= r.from && day <= r.to)
                        return (
                          <div
                            key={day}
                            className={
                              'mx-px h-5 w-7 shrink-0 rounded-sm ' + (match ? (match.kind === 'active' ? 'bg-chart-success/60' : 'bg-chart-info/50') : 'bg-muted')
                            }
                            title={match ? (match.kind === 'active' ? 'Out on rent' : 'Booked') : 'Available'}
                          />
                        )
                      })}
                    </div>
                  )
                })}
                <div className="flex items-center gap-4 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-muted" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-chart-info/50" /> Booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-chart-success/60" /> Out on Rent
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useMemo } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAllRentalAssetStatusLog, useRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { useRentalAgreements } from '@/features/rental/hooks/use-rental-agreements'
import { useSalesInvoices } from '@/features/sales/hooks/use-sales-invoices'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const LOOKBACK_DAYS = 90

export function RentalReportsPage() {
  const { data: assets } = useRentalAssets()
  const { data: agreements } = useRentalAgreements()
  const { data: statusLog } = useAllRentalAssetStatusLog()
  const { data: invoices } = useSalesInvoices()

  const utilizationRows = useMemo(() => {
    const now = Date.now()
    return (assets ?? [])
      .map((asset) => {
        const createdAt = new Date(asset.created_at).getTime()
        const windowStart = Math.max(createdAt, now - LOOKBACK_DAYS * MS_PER_DAY)
        const windowDays = Math.max(1, Math.round((now - windowStart) / MS_PER_DAY))

        const rentedDays = (agreements ?? [])
          .filter((a) => a.rental_asset_id === asset.id)
          .reduce((sum, a) => {
            const from = Math.max(new Date(a.start_date).getTime(), windowStart)
            const to = Math.min(new Date(a.end_date).getTime(), now)
            return sum + Math.max(0, Math.round((to - from) / MS_PER_DAY) + 1)
          }, 0)

        return { asset, utilizationPct: Math.min(100, Math.round((rentedDays / windowDays) * 100)) }
      })
      .sort((a, b) => b.utilizationPct - a.utilizationPct)
  }, [assets, agreements])

  const roiRows = useMemo(() => {
    const agreementAssetById = new Map((agreements ?? []).map((a) => [a.id, a.rental_asset_id]))
    const revenueByAsset = new Map<string, number>()
    for (const invoice of invoices ?? []) {
      if (invoice.invoice_type !== 'rental' || !invoice.rental_agreement_id) continue
      const assetId = agreementAssetById.get(invoice.rental_agreement_id)
      if (!assetId) continue
      revenueByAsset.set(assetId, (revenueByAsset.get(assetId) ?? 0) + invoice.total)
    }
    return (assets ?? [])
      .filter((a) => a.purchase_cost && a.purchase_cost > 0)
      .map((asset) => {
        const revenue = revenueByAsset.get(asset.id) ?? 0
        const roiPct = Math.round(((revenue - asset.purchase_cost!) / asset.purchase_cost!) * 1000) / 10
        return { asset, revenue, roiPct }
      })
      .sort((a, b) => b.roiPct - a.roiPct)
  }, [assets, agreements, invoices])

  const idleRows = useMemo(() => {
    const lastLogByAsset = new Map<string, string>()
    for (const entry of statusLog ?? []) {
      lastLogByAsset.set(entry.rental_asset_id, entry.created_at)
    }
    const now = Date.now()
    return (assets ?? [])
      .filter((a) => a.status === 'available')
      .map((asset) => {
        const since = lastLogByAsset.get(asset.id) ?? asset.created_at
        const idleDays = Math.round((now - new Date(since).getTime()) / MS_PER_DAY)
        return { asset, idleDays }
      })
      .sort((a, b) => b.idleDays - a.idleDays)
  }, [assets, statusLog])

  return (
    <div className="space-y-6">
      <PageHeader title="Rental Reports" description="Machine utilization, profitability, and idle-time." />

      <Tabs defaultValue="utilization">
        <TabsList>
          <TabsTrigger value="utilization">Machine Utilization</TabsTrigger>
          <TabsTrigger value="roi">Profitability / ROI</TabsTrigger>
          <TabsTrigger value="idle">Idle Machines</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Utilization</CardTitle>
              <CardDescription>Share of the last {LOOKBACK_DAYS} days (or since acquisition, if shorter) each asset was under an agreement.</CardDescription>
            </CardHeader>
            <CardContent>
              {utilizationRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No assets yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilizationRows.map((row) => (
                      <TableRow key={row.asset.id}>
                        <TableCell className="font-medium text-foreground">
                          {row.asset.asset_code} — {row.asset.name}
                        </TableCell>
                        <TableCell className="text-right">{row.utilizationPct}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Profitability / ROI</CardTitle>
              <CardDescription>Invoiced rental revenue vs. purchase cost (assets with a recorded purchase cost only).</CardDescription>
            </CardHeader>
            <CardContent>
              {roiRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No assets with a purchase cost recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Purchase Cost</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roiRows.map((row) => (
                      <TableRow key={row.asset.id}>
                        <TableCell className="font-medium text-foreground">
                          {row.asset.asset_code} — {row.asset.name}
                        </TableCell>
                        <TableCell className="text-right">₹{row.asset.purchase_cost!.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{row.revenue.toLocaleString('en-IN')}</TableCell>
                        <TableCell className={'text-right font-medium ' + (row.roiPct >= 0 ? 'text-chart-success' : 'text-chart-critical')}>{row.roiPct}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="idle">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Idle Machines</CardTitle>
              <CardDescription>Available assets, sorted by how long they've sat idle.</CardDescription>
            </CardHeader>
            <CardContent>
              {idleRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No idle assets right now.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Idle For</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {idleRows.map((row) => (
                      <TableRow key={row.asset.id}>
                        <TableCell className="font-medium text-foreground">
                          {row.asset.asset_code} — {row.asset.name}
                        </TableCell>
                        <TableCell className={'text-right ' + (row.idleDays > 14 ? 'font-medium text-chart-warning' : '')}>{row.idleDays} day(s)</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

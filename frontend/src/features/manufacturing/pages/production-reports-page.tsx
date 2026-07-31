import { useMemo } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProductionOrders } from '@/features/manufacturing/hooks/use-production-orders'
import { useAllProductionStageHistory } from '@/features/manufacturing/hooks/use-production-stage-history'
import { useProductionConsumptionMovements } from '@/features/manufacturing/hooks/use-production-reports'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function ProductionReportsPage() {
  const { data: orders } = useProductionOrders()
  const { data: stageHistory } = useAllProductionStageHistory()
  const { data: consumption } = useProductionConsumptionMovements()

  const cycleTimeRows = useMemo(() => {
    const firstByOrder = new Map<string, string>()
    const dispatchByOrder = new Map<string, string>()
    for (const entry of stageHistory ?? []) {
      if (!firstByOrder.has(entry.production_order_id)) firstByOrder.set(entry.production_order_id, entry.created_at)
      if (entry.stage === 'dispatch') dispatchByOrder.set(entry.production_order_id, entry.created_at)
    }
    return (orders ?? [])
      .filter((o) => dispatchByOrder.has(o.id))
      .map((o) => {
        const start = new Date(firstByOrder.get(o.id)!).getTime()
        const end = new Date(dispatchByOrder.get(o.id)!).getTime()
        const days = Math.round(((end - start) / MS_PER_DAY) * 10) / 10
        return { order: o, days }
      })
      .sort((a, b) => b.days - a.days)
  }, [orders, stageHistory])

  const avgCycleDays = cycleTimeRows.length > 0 ? Math.round((cycleTimeRows.reduce((sum, r) => sum + r.days, 0) / cycleTimeRows.length) * 10) / 10 : 0

  const materialCostRows = useMemo(() => {
    const costByOrder = new Map<string, number>()
    for (const movement of consumption ?? []) {
      if (!movement.reference_id) continue
      const cost = Math.abs(movement.quantity) * (movement.product?.purchase_price ?? 0)
      costByOrder.set(movement.reference_id, (costByOrder.get(movement.reference_id) ?? 0) + cost)
    }
    return (orders ?? [])
      .filter((o) => costByOrder.has(o.id))
      .map((o) => ({ order: o, cost: costByOrder.get(o.id)! }))
      .sort((a, b) => b.cost - a.cost)
  }, [orders, consumption])

  return (
    <div className="space-y-6">
      <PageHeader title="Production Reports" description="Order cycle time and raw material cost." />

      <Tabs defaultValue="cycle-time">
        <TabsList>
          <TabsTrigger value="cycle-time">Order Cycle Time</TabsTrigger>
          <TabsTrigger value="material-cost">Material Cost</TabsTrigger>
        </TabsList>

        <TabsContent value="cycle-time">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Cycle Time by Order</CardTitle>
              <CardDescription>{cycleTimeRows.length > 0 ? `Average: ${avgCycleDays} days` : 'Time from the first stage logged to dispatch.'}</CardDescription>
            </CardHeader>
            <CardContent>
              {cycleTimeRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No completed production orders yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Cycle Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycleTimeRows.map((row) => (
                      <TableRow key={row.order.id}>
                        <TableCell className="font-medium text-foreground">{row.order.order_number}</TableCell>
                        <TableCell className="text-muted-foreground">{row.order.product.name}</TableCell>
                        <TableCell className="text-right">{row.days} day(s)</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="material-cost">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Material Cost by Order</CardTitle>
              <CardDescription>Raw materials consumed, valued at each product's purchase price.</CardDescription>
            </CardHeader>
            <CardContent>
              {materialCostRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No production orders have consumed materials yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Material Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialCostRows.map((row) => (
                      <TableRow key={row.order.id}>
                        <TableCell className="font-medium text-foreground">{row.order.order_number}</TableCell>
                        <TableCell className="text-muted-foreground">{row.order.product.name}</TableCell>
                        <TableCell className="text-right">₹{row.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
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

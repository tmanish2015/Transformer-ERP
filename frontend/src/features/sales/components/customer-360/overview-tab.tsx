import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, IndianRupee, ReceiptText, Truck, Wallet, Wrench } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { outstandingAmount, type SalesInvoice, type SalesOrder, type SalesPayment } from '@/features/sales/types/sales-types'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'
import type { RepairJob } from '@/features/workshop/types/workshop-types'

interface OverviewTabProps {
  customerId: string
  orders: SalesOrder[] | undefined
  invoices: SalesInvoice[] | undefined
  payments: (SalesPayment & { sales_invoice: { invoice_number: string } })[] | undefined
  rentalBookings: RentalBookingWithRelations[] | undefined
  repairJobs: RepairJob[] | undefined
}

const chartConfig = {
  invoiced: { label: 'Invoiced', color: 'var(--chart-info)' },
  paid: { label: 'Paid', color: 'var(--chart-success)' },
  outstanding: { label: 'Outstanding', color: 'var(--chart-critical)' },
}

export function OverviewTab({ orders, invoices, rentalBookings, repairJobs }: OverviewTabProps) {
  const navigate = useNavigate()

  const totals = useMemo(() => {
    const totalSales = (orders ?? []).reduce((s, o) => s + o.total, 0)
    const totalInvoiced = (invoices ?? []).reduce((s, i) => s + i.total, 0)
    const totalPaid = (invoices ?? []).reduce((s, i) => s + i.amount_received, 0)
    const outstanding = (invoices ?? []).reduce((s, i) => s + outstandingAmount(i), 0)
    const activeRentals = (rentalBookings ?? []).filter((b) => b.status === 'confirmed').length
    const openRepairs = (repairJobs ?? []).filter((j) => !['completed', 'cancelled'].includes(j.status)).length
    const overdueInvoices = (invoices ?? []).filter((i) => i.status !== 'paid' && i.due_date && new Date(i.due_date).getTime() < Date.now()).length
    return { totalSales, totalInvoiced, totalPaid, outstanding, activeRentals, openRepairs, overdueInvoices }
  }, [orders, invoices, rentalBookings, repairJobs])

  // Last 12 months, invoiced/paid/outstanding from actual invoice dates -- no fabricated history.
  const trend = useMemo(() => {
    const months: { key: string; label: string }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) })
    }
    return months.map(({ key, label }) => {
      const monthInvoices = (invoices ?? []).filter((i) => i.invoice_date.startsWith(key))
      const invoiced = monthInvoices.reduce((s, i) => s + i.total, 0)
      const paid = monthInvoices.reduce((s, i) => s + i.amount_received, 0)
      return { label, invoiced: Math.round(invoiced), paid: Math.round(paid), outstanding: Math.round(invoiced - paid) }
    })
  }, [invoices])

  const hasAnyInvoice = (invoices ?? []).length > 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total Sales" value={`₹${totals.totalSales.toLocaleString('en-IN')}`} icon={IndianRupee} />
        <KpiCard label="Total Invoiced" value={`₹${totals.totalInvoiced.toLocaleString('en-IN')}`} icon={ReceiptText} />
        <KpiCard label="Total Paid" value={`₹${totals.totalPaid.toLocaleString('en-IN')}`} icon={Wallet} tone="success" />
        <KpiCard label="Outstanding" value={`₹${totals.outstanding.toLocaleString('en-IN')}`} icon={AlertTriangle} tone={totals.outstanding > 0 ? 'destructive' : 'default'} />
        <KpiCard label="Active Rentals" value={String(totals.activeRentals)} icon={Truck} />
        <KpiCard label="Open Repairs" value={String(totals.openRepairs)} icon={Wrench} tone={totals.openRepairs > 0 ? 'warning' : 'default'} />
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">Sales &amp; Payment Trend (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAnyInvoice ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet — nothing to chart.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <BarChart data={trend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="invoiced" fill="var(--color-invoiced)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outstanding" fill="var(--color-outstanding)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">Open Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {totals.activeRentals === 0 && totals.openRepairs === 0 && totals.overdueInvoices === 0 ? (
            <p className="text-muted-foreground">No open items for this customer right now.</p>
          ) : (
            <>
              {totals.activeRentals > 0 && (
                <button type="button" className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left hover:bg-muted/50" onClick={() => navigate('.')}>
                  <span>Active Rentals</span>
                  <span className="font-medium text-foreground">{totals.activeRentals}</span>
                </button>
              )}
              {totals.openRepairs > 0 && (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span>Open Repairs</span>
                  <span className="font-medium text-foreground">{totals.openRepairs}</span>
                </div>
              )}
              {totals.overdueInvoices > 0 && (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-chart-critical">Overdue Invoices</span>
                  <span className="font-medium text-chart-critical">{totals.overdueInvoices}</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

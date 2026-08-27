import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowRight, Package, Plus, TrendingDown, TrendingUp, Truck, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useLedgerLines } from '@/features/finance/hooks/use-ledger-lines'
import { useChartOfAccounts } from '@/features/finance/hooks/use-chart-of-accounts'
import { useExpenses } from '@/features/finance/hooks/use-expenses'
import {
  useDashboardBills,
  useDashboardCustomers,
  useDashboardEstimatesAwaitingApproval,
  useDashboardInvoices,
  useDashboardRentalAssetLookup,
  useDashboardRentalAssets,
  useDashboardRentalBookings,
  useDashboardRepairJobs,
  useDashboardStockAlerts,
} from '@/features/dashboard/hooks/use-ceo-dashboard'
import { AskAiBox } from '@/features/dashboard/components/ask-ai-box'
import { DASHBOARD_PERIOD_LABELS, type AgingBucket, type DashboardPeriod } from '@/features/dashboard/types/ceo-dashboard-types'

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const fmtCompact = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  return fmt(n)
}
const todayStr = () => new Date().toISOString().slice(0, 10)
const daysBetween = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000)

function periodStart(period: DashboardPeriod): string {
  const now = new Date()
  if (period === 'today') return todayStr()
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    return d.toISOString().slice(0, 10)
  }
  if (period === 'month') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  // year: Indian financial year, April-March -- matches Financial Reports' own convention
  const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${fyYear}-04-01`
}

function emptyBucket(): AgingBucket {
  return { current: 0, d1_30: 0, d31_60: 0, d60_plus: 0, total: 0 }
}

const trendConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-success)' },
  expense: { label: 'Expenses', color: 'var(--chart-critical)' },
} satisfies ChartConfig

const rentalTrendConfig = {
  revenue: { label: 'Rental Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function CeoDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('month')

  const { data: lines, isLoading: linesLoading } = useLedgerLines()
  const { data: accounts, isLoading: accountsLoading } = useChartOfAccounts()
  const { data: expenses } = useExpenses()
  const { data: invoices, isLoading: invoicesLoading } = useDashboardInvoices()
  const { data: bills } = useDashboardBills()
  const { data: repairJobs, isLoading: jobsLoading } = useDashboardRepairJobs()
  const { data: estimatesAwaiting } = useDashboardEstimatesAwaitingApproval()
  const { data: rentalAssets, isLoading: rentalLoading } = useDashboardRentalAssets()
  const { data: rentalAssetLookup } = useDashboardRentalAssetLookup()
  const { data: rentalBookings } = useDashboardRentalBookings()
  const { data: stockAlerts } = useDashboardStockAlerts()
  const { data: customers } = useDashboardCustomers()

  const isLoading = linesLoading || accountsLoading || invoicesLoading || jobsLoading || rentalLoading

  const from = periodStart(period)
  const to = todayStr()

  const postedLines = useMemo(() => (lines ?? []).filter((l) => l.journal_entry && l.journal_entry.status === 'posted'), [lines])

  // ---------- Revenue / Expense / Profit (same accounting logic as Financial Reports) ----------
  const pnl = useMemo(() => {
    const incomeAccounts = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'income')
    const expenseAccounts = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'expense')
    const sumFor = (accountId: string, fromDate: string, toDate: string) =>
      postedLines.filter((l) => l.account_id === accountId && l.journal_entry!.entry_date >= fromDate && l.journal_entry!.entry_date <= toDate).reduce((s, l) => s + l.credit - l.debit, 0)

    const revenue = incomeAccounts.reduce((s, a) => s + sumFor(a.id, from, to), 0)
    const expenseByAccount = expenseAccounts.map((a) => ({ id: a.id, code: a.code, name: a.name, amount: -sumFor(a.id, from, to) })).filter((r) => r.amount !== 0)
    const totalExpense = expenseByAccount.reduce((s, r) => s + r.amount, 0)
    const profit = revenue - totalExpense
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    return { revenue, totalExpense, profit, margin, expenseByAccount, incomeAccounts, expenseAccounts, sumFor }
  }, [accounts, postedLines, from, to])

  // ---------- Cash & Bank ----------
  const cash = useMemo(() => {
    const cashAcc = (accounts ?? []).find((a) => a.code === '1001')
    const bankAcc = (accounts ?? []).find((a) => a.code === '1002')
    const balanceAsOf = (accountId: string | undefined, asOf: string) => {
      if (!accountId) return null
      const acc = (accounts ?? []).find((a) => a.id === accountId)!
      const opening = acc.opening_balance_type === 'debit' ? acc.opening_balance : -acc.opening_balance
      const movement = postedLines.filter((l) => l.account_id === accountId && l.journal_entry!.entry_date <= asOf).reduce((s, l) => s + l.debit - l.credit, 0)
      return opening + movement
    }
    const cashBalance = balanceAsOf(cashAcc?.id, to)
    const bankBalance = balanceAsOf(bankAcc?.id, to)
    const cashBankIds = new Set([cashAcc?.id, bankAcc?.id].filter(Boolean))
    const todayLines = postedLines.filter((l) => cashBankIds.has(l.account_id) && l.journal_entry!.entry_date === todayStr())
    const collections = todayLines.reduce((s, l) => s + l.debit, 0)
    const payments = todayLines.reduce((s, l) => s + l.credit, 0)
    return {
      total: (cashBalance ?? 0) + (bankBalance ?? 0),
      cashBalance: cashBalance ?? null,
      bankBalance: bankBalance ?? null,
      collections,
      payments,
      net: collections - payments,
    }
  }, [accounts, postedLines, to])

  // ---------- Receivables / Payables (from invoices/bills, not ledger -- has due dates) ----------
  const aging = (rows: { total: number; paid: number; dueOrDocDate: string }[]): AgingBucket => {
    const b = emptyBucket()
    const today = todayStr()
    for (const r of rows) {
      const outstanding = r.total - r.paid
      if (outstanding <= 0.01) continue
      const days = daysBetween(today, r.dueOrDocDate)
      b.total += outstanding
      if (days <= 0) b.current += outstanding
      else if (days <= 30) b.d1_30 += outstanding
      else if (days <= 60) b.d31_60 += outstanding
      else b.d60_plus += outstanding
    }
    return b
  }

  const receivables = useMemo(
    () => aging((invoices ?? []).map((i) => ({ total: i.total, paid: i.amount_received, dueOrDocDate: i.due_date ?? i.invoice_date }))),
    [invoices],
  )
  const payables = useMemo(() => aging((bills ?? []).map((b) => ({ total: b.total, paid: b.amount_paid, dueOrDocDate: b.due_date ?? b.bill_date }))), [bills])

  const overdueReceivablesCount = useMemo(
    () => (invoices ?? []).filter((i) => i.total - i.amount_received > 0.01 && i.due_date && i.due_date < todayStr()).length,
    [invoices],
  )

  // ---------- Repair Jobs ----------
  const jobStats = useMemo(() => {
    const jobs = repairJobs ?? []
    const active = jobs.filter((j) => j.status === 'in_progress')
    const completed = jobs.filter((j) => j.status === 'completed')
    const pending = jobs.filter((j) => ['received', 'inspection', 'estimate_pending', 'approved'].includes(j.status))
    const cancelled = jobs.filter((j) => j.status === 'cancelled')
    const today = todayStr()
    const delayed = jobs.filter((j) => {
      if (j.status === 'completed' || j.status === 'cancelled') return false
      const ref = j.last_stage_at ?? j.created_at
      return daysBetween(today, ref.slice(0, 10)) > 7
    })
    const awaitingTesting = jobs.filter((j) => j.current_stage === 'testing' && j.status !== 'completed' && j.status !== 'cancelled')
    const readyForDelivery = jobs.filter((j) => j.current_stage === 'dispatch' && j.status !== 'completed' && j.status !== 'cancelled')

    const repairInvoices = (invoices ?? []).filter((i) => i.invoice_type === 'repair')
    const avgJobValue = repairInvoices.length > 0 ? repairInvoices.reduce((s, i) => s + i.total, 0) / repairInvoices.length : null

    const completedWithDuration = completed.filter((j) => j.last_stage_at)
    const avgRepairDays =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((s, j) => s + daysBetween(j.last_stage_at!.slice(0, 10), j.created_at.slice(0, 10)), 0) / completedWithDuration.length
        : null

    const profitability = jobs
      .map((j) => {
        const revenue = (invoices ?? []).filter((i) => i.repair_job_id === j.id).reduce((s, i) => s + i.total, 0)
        return { job: j.job_number, customer: j.customer_name, revenue }
      })
      .filter((r) => r.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    return { jobs, active, completed, pending, cancelled, delayed, awaitingTesting, readyForDelivery, avgJobValue, avgRepairDays, profitability }
  }, [repairJobs, invoices])

  // ---------- Expenses ----------
  const expenseSummary = useMemo(() => {
    const now = new Date()
    const curStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevStart = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)

    const currentTotal = pnl.expenseAccounts.reduce((s, a) => s + -pnl.sumFor(a.id, curStart, to), 0)
    const previousTotal = pnl.expenseAccounts.reduce((s, a) => s + -pnl.sumFor(a.id, prevStart, prevEnd), 0)
    const momChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null

    const byCategory = pnl.expenseAccounts
      .map((a) => ({
        name: a.name,
        current: -pnl.sumFor(a.id, curStart, to),
        previous: -pnl.sumFor(a.id, prevStart, prevEnd),
      }))
      .filter((r) => r.current !== 0 || r.previous !== 0)
      .sort((a, b) => b.current - a.current)

    const unusual = byCategory.filter((r) => r.previous > 0 && r.current > r.previous * 1.3 && r.current - r.previous > 1000)

    const jobLinked = (expenses ?? []).filter((e) => e.repair_job_id).reduce((s, e) => s + e.amount, 0)
    const nonJob = (expenses ?? []).filter((e) => !e.repair_job_id).reduce((s, e) => s + e.amount, 0)

    return { currentTotal, previousTotal, momChange, byCategory: byCategory.slice(0, 6), unusual, jobLinked, nonJob }
  }, [pnl, to, expenses])

  // ---------- Customers ----------
  const customerStats = useMemo(() => {
    const byRevenue = new Map<string, { name: string; revenue: number }>()
    const byOutstanding = new Map<string, { name: string; outstanding: number }>()
    for (const inv of invoices ?? []) {
      const rev = byRevenue.get(inv.customer_id) ?? { name: inv.customer_name, revenue: 0 }
      rev.revenue += inv.total
      byRevenue.set(inv.customer_id, rev)
      const outstanding = inv.total - inv.amount_received
      if (outstanding > 0.01) {
        const o = byOutstanding.get(inv.customer_id) ?? { name: inv.customer_name, outstanding: 0 }
        o.outstanding += outstanding
        byOutstanding.set(inv.customer_id, o)
      }
    }
    const newCustomers = (customers ?? []).filter((c) => c.created_at.slice(0, 10) >= from)
    return {
      topByRevenue: [...byRevenue.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      topByOutstanding: [...byOutstanding.values()].sort((a, b) => b.outstanding - a.outstanding).slice(0, 5),
      newCustomers: newCustomers.length,
    }
  }, [invoices, customers, from])

  // ---------- Rental ----------
  // No formal Rental Agreement process is in use, so nothing here reads rental_agreements
  // dates/status. rentalAssetLookup touches rental_agreements ONLY to resolve which physical
  // machine a rental invoice belongs to (id lookup) -- see fetchDashboardRentalAssetLookup.
  // "Current rentals" and any date-based rental view come from rental_bookings instead, which
  // is a separate, independently-populated table.
  const rental = useMemo(() => {
    const assets = rentalAssets ?? []
    const assetLookup = rentalAssetLookup ?? []
    const bookings = rentalBookings ?? []
    const total = assets.length
    const available = assets.filter((a) => a.status === 'available').length
    const rented = assets.filter((a) => ['booked', 'dispatched', 'running'].includes(a.status)).length
    const maintenance = assets.filter((a) => a.status === 'maintenance').length
    const retired = assets.filter((a) => a.status === 'retired').length
    const usableFleet = total - retired
    const utilization = usableFleet > 0 ? (rented / usableFleet) * 100 : null

    const rentalInvoices = (invoices ?? []).filter((i) => i.invoice_type === 'rental')
    const rentalRevenue = rentalInvoices.filter((i) => i.invoice_date >= from && i.invoice_date <= to).reduce((s, i) => s + i.total, 0)

    const now = new Date()
    const curStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevStart = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
    const curMonthRevenue = rentalInvoices.filter((i) => i.invoice_date >= curStart && i.invoice_date <= to).reduce((s, i) => s + i.total, 0)
    const prevMonthRevenue = rentalInvoices.filter((i) => i.invoice_date >= prevStart && i.invoice_date <= prevEnd).reduce((s, i) => s + i.total, 0)
    const revenueChangePct = prevMonthRevenue > 0 ? ((curMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : null

    const rentalReceivables = aging(rentalInvoices.map((i) => ({ total: i.total, paid: i.amount_received, dueOrDocDate: i.due_date ?? i.invoice_date })))

    // Machine identity for a rental invoice: invoice -> rental_agreement_id -> rental_asset_id
    // (id lookup only). Customer comes from the invoice itself, not the agreement.
    const revenueByAsset = new Map<string, { assetName: string; customerName: string; revenue: number }>()
    for (const inv of rentalInvoices) {
      const lookup = assetLookup.find((a) => a.id === inv.rental_agreement_id)
      if (!lookup) continue
      const key = lookup.rental_asset_id
      const cur = revenueByAsset.get(key) ?? { assetName: lookup.asset_name, customerName: inv.customer_name, revenue: 0 }
      cur.revenue += inv.total
      cur.customerName = inv.customer_name
      revenueByAsset.set(key, cur)
    }
    const topMachines = [...revenueByAsset.values()]
      .filter((m) => m.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Current/active rentals from rental_bookings (independent of rental_agreements): a
    // confirmed booking whose date range covers today.
    // status alone (not end_date -- see note above the fetch function) determines "current":
    // a confirmed booking that hasn't been completed or cancelled.
    const currentRentals = bookings.filter((b) => b.status === 'confirmed').slice(0, 8)

    const maintenanceAssets = assets.filter((a) => a.status === 'maintenance')
    const idleAvailable = assets.filter((a) => a.status === 'available')

    return {
      total,
      available,
      rented,
      maintenance,
      retired,
      utilization,
      rentalRevenue,
      curMonthRevenue,
      prevMonthRevenue,
      revenueChangePct,
      rentalReceivables,
      topMachines,
      currentRentals,
      maintenanceAssets,
      idleAvailable,
    }
  }, [rentalAssets, rentalAssetLookup, rentalBookings, invoices, from, to])

  // ---------- Trend (last 6 months, revenue vs expense) ----------
  const trendData = useMemo(() => {
    const months: { label: string; start: string; end: string }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      months.push({
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        start: d.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      })
    }
    return months.map((m) => ({
      month: m.label,
      revenue: pnl.incomeAccounts.reduce((s, a) => s + pnl.sumFor(a.id, m.start, m.end), 0),
      expense: pnl.expenseAccounts.reduce((s, a) => s + -pnl.sumFor(a.id, m.start, m.end), 0),
    }))
  }, [pnl])

  const rentalTrendData = useMemo(() => {
    const months: { label: string; start: string; end: string }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      months.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), start: d.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) })
    }
    const rentalInvoices = (invoices ?? []).filter((i) => i.invoice_type === 'rental')
    return months.map((m) => ({ month: m.label, revenue: rentalInvoices.filter((i) => i.invoice_date >= m.start && i.invoice_date <= m.end).reduce((s, i) => s + i.total, 0) }))
  }, [invoices])

  // ---------- Needs Attention ----------
  const attentionItems = useMemo(() => {
    const items: { level: 'red' | 'orange'; text: string }[] = []
    if (overdueReceivablesCount > 0) items.push({ level: 'red', text: `${overdueReceivablesCount} customer payment${overdueReceivablesCount === 1 ? '' : 's'} overdue, totalling ${fmtCompact(receivables.d1_30 + receivables.d31_60 + receivables.d60_plus)}` })
    if (jobStats.delayed.length > 0) items.push({ level: 'red', text: `${jobStats.delayed.length} repair job${jobStats.delayed.length === 1 ? '' : 's'} with no stage update in over 7 days` })
    for (const u of expenseSummary.unusual) items.push({ level: 'orange', text: `Unusually high expense: ${u.name} is up ${Math.round(((u.current - u.previous) / u.previous) * 100)}% vs last month` })
    if ((stockAlerts ?? []).length > 0) items.push({ level: 'orange', text: `${stockAlerts!.length} product${stockAlerts!.length === 1 ? '' : 's'} at or below reorder level` })
    if ((estimatesAwaiting ?? 0) > 0) items.push({ level: 'orange', text: `${estimatesAwaiting} repair estimate${estimatesAwaiting === 1 ? '' : 's'} awaiting customer approval` })
    if (rental.maintenanceAssets.length > 0) items.push({ level: 'orange', text: `${rental.maintenanceAssets.length} rental machine${rental.maintenanceAssets.length === 1 ? '' : 's'} currently under maintenance` })
    const bigRentalOverdue = rental.rentalReceivables.d31_60 + rental.rentalReceivables.d60_plus
    if (bigRentalOverdue > 0) items.push({ level: 'orange', text: `${fmtCompact(bigRentalOverdue)} in rental payments overdue by more than 30 days` })
    return items
  }, [overdueReceivablesCount, receivables, jobStats.delayed.length, expenseSummary.unusual, stockAlerts, estimatesAwaiting, rental])

  // ---------- AI Executive Briefing (deterministic, data-grounded -- no LLM call on load) ----------
  const briefing = useMemo(() => {
    if (isLoading) return null
    const lines: string[] = []
    lines.push(
      jobStats.active.length > 0 || overdueReceivablesCount > 0 || jobStats.delayed.length > 0
        ? attentionItems.some((a) => a.level === 'red')
          ? 'Business needs attention in a few areas below.'
          : 'Business is performing normally.'
        : 'Business is performing normally.',
    )
    lines.push(`${jobStats.active.length} repair job${jobStats.active.length === 1 ? ' is' : 's are'} currently active${jobStats.pending.length > 0 ? `, ${jobStats.pending.length} pending` : ''}.`)
    if (receivables.total > 0) lines.push(`${fmtCompact(receivables.total)} is outstanding from customers${overdueReceivablesCount > 0 ? `, with ${overdueReceivablesCount} payment${overdueReceivablesCount === 1 ? '' : 's'} overdue` : ''}.`)
    else lines.push('No outstanding customer payments.')
    if (expenseSummary.momChange !== null) lines.push(`Expenses ${expenseSummary.momChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(expenseSummary.momChange))}% this month vs last month.`)
    else lines.push('Expense trend vs last month: not available yet (no prior month data).')
    if (rental.utilization !== null) lines.push(`Machine rental utilisation is ${Math.round(rental.utilization)}% (${rental.rented} of ${rental.total - rental.retired} machines rented).`)
    return lines.join(' ')
  }, [isLoading, jobStats, overdueReceivablesCount, receivables, expenseSummary.momChange, rental, attentionItems])

  const rentalInsight = useMemo(() => {
    if (isLoading) return null
    const lines: string[] = []
    if (rental.utilization !== null) lines.push(`Rental utilisation is ${Math.round(rental.utilization)}% ${DASHBOARD_PERIOD_LABELS[period].toLowerCase()}.`)
    if (rental.topMachines.length > 0) lines.push(`${rental.topMachines[0].assetName} generates the highest rental revenue (${fmtCompact(rental.topMachines[0].revenue)}).`)
    const bigOverdue = [...(invoices ?? [])]
      .filter((i) => i.invoice_type === 'rental' && i.total - i.amount_received > 0.01)
      .sort((a, b) => b.total - b.amount_received - (a.total - a.amount_received))[0]
    if (bigOverdue) lines.push(`${fmtCompact(bigOverdue.total - bigOverdue.amount_received)} rental payment is outstanding from ${bigOverdue.customer_name}.`)
    if (rental.idleAvailable.length > 0) lines.push(`${rental.idleAvailable.length} machine${rental.idleAvailable.length === 1 ? ' is' : 's are'} currently available (not rented).`)
    return lines.length > 0 ? lines.join(' ') : 'Not enough rental activity yet to generate an insight.'
  }, [isLoading, rental, invoices, period])

  return (
    <div className="space-y-6">
      <PageHeader
        title="CEO Dashboard"
        description="Executive overview of business, repair, and rental performance."
        actions={
          <Select value={period} onValueChange={(v) => setPeriod((v as DashboardPeriod) ?? 'month')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DASHBOARD_PERIOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* ---------- KPI Cards ---------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Revenue" value={fmtCompact(pnl.revenue)} />
        <KpiCard label="Expenses" value={fmtCompact(pnl.totalExpense)} />
        <KpiCard label="Profit / Margin" value={fmtCompact(pnl.profit)} sub={`${pnl.margin.toFixed(1)}% margin`} tone={pnl.profit >= 0 ? 'good' : 'bad'} />
        <KpiCard label="Cash & Bank" value={fmtCompact(cash.total)} />
        <KpiCard label="Outstanding Receivables" value={fmtCompact(receivables.total)} tone={overdueReceivablesCount > 0 ? 'bad' : undefined} />
        <KpiCard label="Outstanding Payables" value={fmtCompact(payables.total)} />
        <KpiCard label="Active Repair Jobs" value={String(jobStats.active.length)} />
        <KpiCard label="Pending Customer Payments" value={String((invoices ?? []).filter((i) => i.total - i.amount_received > 0.01).length)} />
      </div>

      {/* ---------- AI Executive Briefing ---------- */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">AI Business Briefing</CardTitle>
        </CardHeader>
        <CardContent>
          {briefing ? <p className="text-sm leading-relaxed text-foreground">{briefing}</p> : <p className="text-sm text-muted-foreground">Loading business data...</p>}
        </CardContent>
      </Card>

      {/* ---------- Needs Your Attention ---------- */}
      {attentionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs Your Attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attentionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={item.level === 'red' ? 'text-chart-critical' : 'text-chart-warning'}>{item.level === 'red' ? '🔴' : '🟠'}</span>
                <span className="text-foreground">{item.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ---------- Quick Actions ---------- */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <Button size="sm" render={<Link to="/sales/customers" />} nativeButton={false}>
            <Plus className="size-3.5" /> New Customer
          </Button>
          <Button size="sm" render={<Link to="/workshop/jobs" />} nativeButton={false}>
            <Plus className="size-3.5" /> New Repair Job
          </Button>
          <Button size="sm" render={<Link to="/finance/expenses" />} nativeButton={false}>
            <Plus className="size-3.5" /> New Expense
          </Button>
          <Button size="sm" render={<Link to="/sales/quotations" />} nativeButton={false}>
            <Plus className="size-3.5" /> New Quotation
          </Button>
          <Button size="sm" render={<Link to="/sales/invoices" />} nativeButton={false}>
            <Plus className="size-3.5" /> New Invoice
          </Button>
          <Button size="sm" variant="outline" render={<Link to="/sales/customer-ledger" />} nativeButton={false}>
            View Receivables <ArrowRight className="size-3.5" />
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="finance">
        <TabsList>
          <TabsTrigger value="finance">Revenue &amp; Finance</TabsTrigger>
          <TabsTrigger value="repair">Repair Business</TabsTrigger>
          <TabsTrigger value="rental">Machine Rental</TabsTrigger>
          <TabsTrigger value="customers">Customers &amp; Inventory</TabsTrigger>
        </TabsList>

        {/* ================= FINANCE TAB ================= */}
        <TabsContent value="finance" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue vs Expenses (last 6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendConfig} className="h-64 w-full">
                <BarChart data={trendData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v) => fmtCompact(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receivables Aging</CardTitle>
              </CardHeader>
              <CardContent>
                <AgingTable bucket={receivables} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payables Aging</CardTitle>
              </CardHeader>
              <CardContent>
                <AgingTable bucket={payables} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cash Position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Cash in Hand" value={cash.cashBalance !== null ? fmt(cash.cashBalance) : 'Not available'} />
                <Row label="Bank Balance" value={cash.bankBalance !== null ? fmt(cash.bankBalance) : 'Not available'} />
                <Row label="Today's Collections" value={fmt(cash.collections)} />
                <Row label="Today's Payments" value={fmt(cash.payments)} />
                <Row label="Net Cash Flow (today)" value={fmt(cash.net)} bold />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Total Expenses (period)" value={fmt(expenseSummary.currentTotal)} />
                <Row label="Previous Month" value={fmt(expenseSummary.previousTotal)} />
                <Row label="Change vs Last Month" value={expenseSummary.momChange !== null ? `${expenseSummary.momChange >= 0 ? '+' : ''}${expenseSummary.momChange.toFixed(1)}%` : 'Not available'} />
                <Row label="Job-related (Expense module)" value={fmt(expenseSummary.jobLinked)} />
                <Row label="Non-job (Expense module)" value={fmt(expenseSummary.nonJob)} />
                <div className="pt-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Top Categories</p>
                  {expenseSummary.byCategory.length === 0 && <p className="text-xs text-muted-foreground">No expenses recorded.</p>}
                  {expenseSummary.byCategory.map((c) => (
                    <Row key={c.name} label={c.name} value={fmt(c.current)} small />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= REPAIR TAB ================= */}
        <TabsContent value="repair" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Active" value={String(jobStats.active.length)} icon={Wrench} />
            <KpiCard label="Pending" value={String(jobStats.pending.length)} />
            <KpiCard label="Completed" value={String(jobStats.completed.length)} />
            <KpiCard label="Delayed (7+ days no update)" value={String(jobStats.delayed.length)} tone={jobStats.delayed.length > 0 ? 'bad' : undefined} />
            <KpiCard label="Awaiting Customer Approval" value={String(estimatesAwaiting ?? 0)} />
            <KpiCard label="Awaiting Material" value="Not available" muted />
            <KpiCard label="Awaiting Testing" value={String(jobStats.awaitingTesting.length)} />
            <KpiCard label="Ready for Delivery" value={String(jobStats.readyForDelivery.length)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard label="Average Job Value" value={jobStats.avgJobValue !== null ? fmt(jobStats.avgJobValue) : 'Not available'} />
            <KpiCard label="Average Repair Time" value={jobStats.avgRepairDays !== null ? `${jobStats.avgRepairDays.toFixed(1)} days` : 'Not available'} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Profitability</CardTitle>
              <p className="text-xs text-muted-foreground">Cost tracking isn't implemented for repair jobs yet, so only revenue is shown.</p>
            </CardHeader>
            <CardContent>
              {jobStats.profitability.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoiced repair jobs yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobStats.profitability.map((r) => (
                      <TableRow key={r.job}>
                        <TableCell className="font-medium">{r.job}</TableCell>
                        <TableCell>{r.customer}</TableCell>
                        <TableCell className="text-right">{fmt(r.revenue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">—</TableCell>
                        <TableCell className="text-right text-muted-foreground">—</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= RENTAL TAB ================= */}
        <TabsContent value="rental" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Total Machines" value={String(rental.total)} icon={Truck} />
            <KpiCard label="Available" value={String(rental.available)} />
            <KpiCard label="Currently Rented" value={String(rental.rented)} />
            <KpiCard label="Under Maintenance" value={String(rental.maintenance)} tone={rental.maintenance > 0 ? 'bad' : undefined} />
            <KpiCard label="Rental Revenue (period)" value={fmtCompact(rental.rentalRevenue)} />
            <KpiCard label="Outstanding Rental" value={fmtCompact(rental.rentalReceivables.total)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Machine Utilisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rental.utilization !== null ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-foreground">{Math.round(rental.utilization)}%</span>
                      <span className="text-xs text-muted-foreground">
                        {rental.rented} rented / {rental.total - rental.retired} usable
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, rental.utilization)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Rented: {rental.rented}</span>
                      <span>Available: {rental.available}</span>
                      <span>Maintenance: {rental.maintenance}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not available -- no rental assets yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rental Revenue Trend</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{fmt(rental.curMonthRevenue)} this month</span>
                  {rental.revenueChangePct !== null && (
                    <Badge variant={rental.revenueChangePct >= 0 ? 'default' : 'destructive'} className="gap-1">
                      {rental.revenueChangePct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {Math.abs(rental.revenueChangePct).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={rentalTrendConfig} className="h-40 w-full">
                  <LineChart data={rentalTrendData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={50} tickFormatter={(v) => fmtCompact(v)} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle className="text-base">AI Rental Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{rentalInsight ?? 'Loading...'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Rental Machines</CardTitle>
            </CardHeader>
            <CardContent>
              {rental.topMachines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rental invoices yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rental.topMachines.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{m.assetName}</TableCell>
                        <TableCell>{m.customerName}</TableCell>
                        <TableCell className="text-right">{fmt(m.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Rentals</CardTitle>
              <p className="text-xs text-muted-foreground">Confirmed rental bookings not yet completed or cancelled. Expected-return dates aren't shown -- the underlying data isn't reliable yet.</p>
            </CardHeader>
            <CardContent>
              {rental.currentRentals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active rentals.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Start</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rental.currentRentals.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.asset_name}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.start_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {rental.maintenanceAssets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rental Maintenance Alert</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {rental.maintenanceAssets.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="size-3.5 text-chart-warning" />
                    <span>
                      {a.name} ({a.asset_code}) — currently under maintenance
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rental Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <AgingTable bucket={rental.rentalReceivables} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= CUSTOMERS & INVENTORY TAB ================= */}
        <TabsContent value="customers" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Customers by Revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {customerStats.topByRevenue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoiced customers yet.</p>
                ) : (
                  customerStats.topByRevenue.map((c) => <Row key={c.name} label={c.name} value={fmt(c.revenue)} />)
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Customers by Outstanding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {customerStats.topByOutstanding.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No outstanding balances.</p>
                ) : (
                  customerStats.topByOutstanding.map((c) => <Row key={c.name} label={c.name} value={fmt(c.outstanding)} />)
                )}
              </CardContent>
            </Card>
          </div>
          <KpiCard label={`New Customers (${DASHBOARD_PERIOD_LABELS[period]})`} value={String(customerStats.newCustomers)} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-4" /> Inventory Alerts
              </CardTitle>
              <p className="text-xs text-muted-foreground">Material-to-job linkage isn't tracked yet, so job-specific shortage alerts aren't available -- showing stock-level alerts only.</p>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {(stockAlerts ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No products at or below reorder level.</p>
              ) : (
                (stockAlerts ?? []).map((s) => (
                  <div key={s.product_id} className="flex items-center justify-between text-sm">
                    <span>
                      {s.name} <span className="text-xs text-muted-foreground">({s.sku})</span>
                    </span>
                    <Badge variant={s.quantity <= 0 ? 'destructive' : 'outline'}>
                      {s.quantity} in stock (reorder at {s.reorder_level})
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AskAiBox />
    </div>
  )
}

function KpiCard({ label, value, sub, tone, icon: Icon, muted }: { label: string; value: string; sub?: string; tone?: 'good' | 'bad'; icon?: typeof Wrench; muted?: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-1 py-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon && <Icon className="size-3.5" />}
          {label}
        </div>
        <p className={`text-xl font-semibold ${muted ? 'text-muted-foreground' : tone === 'good' ? 'text-chart-success' : tone === 'bad' ? 'text-chart-critical' : 'text-foreground'}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function Row({ label, value, bold, small }: { label: string; value: string; bold?: boolean; small?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${small ? 'text-xs' : 'text-sm'}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-semibold text-foreground' : 'text-foreground'}>{value}</span>
    </div>
  )
}

function AgingTable({ bucket }: { bucket: AgingBucket }) {
  return (
    <div className="space-y-2 text-sm">
      <Row label="Total Outstanding" value={fmt(bucket.total)} bold />
      <Row label="Current" value={fmt(bucket.current)} />
      <Row label="1-30 Days" value={fmt(bucket.d1_30)} />
      <Row label="31-60 Days" value={fmt(bucket.d31_60)} />
      <Row label="60+ Days" value={fmt(bucket.d60_plus)} />
      {bucket.d60_plus > 0 && (
        <div className="flex items-center gap-1.5 pt-1 text-xs text-chart-critical">
          <AlertTriangle className="size-3" /> {fmt(bucket.d60_plus)} overdue by more than 60 days
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Banknote, Briefcase, CircleDollarSign, Landmark, ReceiptText, ShieldCheck, TrendingDown, TrendingUp, Truck, Users, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useLedgerLines } from '@/features/finance/hooks/use-ledger-lines'
import { useChartOfAccounts } from '@/features/finance/hooks/use-chart-of-accounts'
import {
  useDashboardBills,
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
  const sign = n < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`
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

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning, Owner! Here’s your business overview.'
  if (hour < 17) return 'Good afternoon, Owner! Here’s your business overview.'
  return 'Good evening, Owner! Here’s your business overview.'
}

function lastNMonths(n: number, offsetMonths = 0) {
  const months: { label: string; start: string; end: string }[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i - offsetMonths, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i - offsetMonths + 1, 0)
    months.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), start: d.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) })
  }
  return months
}

const trendConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-success)' },
  expense: { label: 'Expenses', color: 'var(--chart-critical)' },
  profit: { label: 'Profit', color: 'var(--chart-2)' },
} satisfies ChartConfig

const rentalHeroConfig = {
  revenue: { label: 'Rental Revenue', color: 'var(--primary)' },
} satisfies ChartConfig

const rentalComparisonConfig = {
  current: { label: 'Current Period', color: 'var(--primary)' },
  previous: { label: 'Previous Period', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

const expenseDonutColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-critical)']

export function CeoDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('month')

  const { data: lines, isLoading: linesLoading } = useLedgerLines()
  const { data: accounts, isLoading: accountsLoading } = useChartOfAccounts()
  const { data: invoices, isLoading: invoicesLoading } = useDashboardInvoices()
  const { data: bills } = useDashboardBills()
  const { data: repairJobs, isLoading: jobsLoading } = useDashboardRepairJobs()
  const { data: estimatesAwaiting } = useDashboardEstimatesAwaitingApproval()
  const { data: rentalAssets, isLoading: rentalLoading } = useDashboardRentalAssets()
  const { data: rentalAssetLookup } = useDashboardRentalAssetLookup()
  const { data: rentalBookings } = useDashboardRentalBookings()
  const { data: stockAlerts } = useDashboardStockAlerts()

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

    // Month-over-month comparison, independent of the period selector, for KPI trend arrows.
    const now = new Date()
    const curStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevStart = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
    const curRevenue = incomeAccounts.reduce((s, a) => s + sumFor(a.id, curStart, to), 0)
    const prevRevenue = incomeAccounts.reduce((s, a) => s + sumFor(a.id, prevStart, prevEnd), 0)
    const revenueChangePct = prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : null
    const curExpense = expenseAccounts.reduce((s, a) => s + -sumFor(a.id, curStart, to), 0)
    const prevExpense = expenseAccounts.reduce((s, a) => s + -sumFor(a.id, prevStart, prevEnd), 0)
    const expenseChangePct = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : null
    const curProfit = curRevenue - curExpense
    const prevProfit = prevRevenue - prevExpense
    const profitChangePct = prevProfit !== 0 ? ((curProfit - prevProfit) / Math.abs(prevProfit)) * 100 : null

    return { revenue, totalExpense, profit, margin, expenseByAccount, incomeAccounts, expenseAccounts, sumFor, revenueChangePct, expenseChangePct, profitChangePct }
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
      .slice(0, 5)

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
    const donutData = byCategory.slice(0, 6).map((c, i) => ({ name: c.name, value: c.current, fill: expenseDonutColors[i % expenseDonutColors.length] }))

    return { currentTotal, previousTotal, momChange, byCategory: byCategory.slice(0, 6), unusual, donutData }
  }, [pnl, to])

  // ---------- Rental ----------
  // No formal Rental Agreement process is in use, so nothing here reads rental_agreements
  // dates/status. rentalAssetLookup touches rental_agreements ONLY to resolve which physical
  // machine a rental invoice belongs to (id lookup) -- see fetchDashboardRentalAssetLookup.
  // "Current rentals" and any date-based rental view come from rental_bookings instead, which
  // is a separate, independently-populated table -- and its end_date is never read either,
  // since it's just as corrupted as rental_agreements.end_date.
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

    // Last-6-months total vs the 6 months before that -- real data, used for the hero card's
    // "vs Previous 6 Months" comparison.
    const last6 = lastNMonths(6)
    const prior6 = lastNMonths(6, 6)
    const last6Total = rentalInvoices.filter((i) => i.invoice_date >= last6[0].start && i.invoice_date <= last6[5].end).reduce((s, i) => s + i.total, 0)
    const prior6Total = rentalInvoices.filter((i) => i.invoice_date >= prior6[0].start && i.invoice_date <= prior6[5].end).reduce((s, i) => s + i.total, 0)
    const sixMonthChangePct = prior6Total > 0 ? ((last6Total - prior6Total) / prior6Total) * 100 : null

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

    // Current/active rentals from rental_bookings status alone (not end_date -- see note
    // above): a confirmed booking that hasn't been completed or cancelled.
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
      sixMonthChangePct,
      rentalReceivables,
      topMachines,
      currentRentals,
      maintenanceAssets,
      idleAvailable,
    }
  }, [rentalAssets, rentalAssetLookup, rentalBookings, invoices, from, to])

  // ---------- Trend charts (last 6 months) ----------
  const trendData = useMemo(() => {
    return lastNMonths(6).map((m) => {
      const revenue = pnl.incomeAccounts.reduce((s, a) => s + pnl.sumFor(a.id, m.start, m.end), 0)
      const expense = pnl.expenseAccounts.reduce((s, a) => s + -pnl.sumFor(a.id, m.start, m.end), 0)
      return { month: m.label, revenue, expense, profit: revenue - expense }
    })
  }, [pnl])

  // Real month-by-month rental revenue, current 6 months and the 6 months immediately before
  // -- an honest "current vs previous period" comparison. If there's no data that far back
  // (a new install), the "previous" bars are genuinely 0, not fabricated.
  const rentalComparisonData = useMemo(() => {
    const rentalInvoices = (invoices ?? []).filter((i) => i.invoice_type === 'rental')
    const revenueFor = (m: { start: string; end: string }) => rentalInvoices.filter((i) => i.invoice_date >= m.start && i.invoice_date <= m.end).reduce((s, i) => s + i.total, 0)
    const current = lastNMonths(6)
    const previous = lastNMonths(6, 6)
    return current.map((m, i) => ({ month: m.label, current: revenueFor(m), previous: revenueFor(previous[i]) }))
  }, [invoices])

  // ---------- Needs Attention ----------
  const attentionItems = useMemo(() => {
    const items: { level: 'red' | 'orange'; text: string; count: number }[] = []
    if (overdueReceivablesCount > 0) items.push({ level: 'red', text: 'Overdue Receivables', count: overdueReceivablesCount })
    if (jobStats.delayed.length > 0) items.push({ level: 'red', text: 'Delayed Repair Jobs', count: jobStats.delayed.length })
    if ((stockAlerts ?? []).length > 0) items.push({ level: 'orange', text: 'Low Stock Items', count: stockAlerts!.length })
    if (expenseSummary.unusual.length > 0) items.push({ level: 'orange', text: 'Unusually High Expenses', count: expenseSummary.unusual.length })
    if ((estimatesAwaiting ?? 0) > 0) items.push({ level: 'orange', text: 'Pending Quotations', count: estimatesAwaiting! })
    if (rental.maintenanceAssets.length > 0) items.push({ level: 'orange', text: 'Machines Under Maintenance', count: rental.maintenanceAssets.length })
    const bigRentalOverdue = rental.rentalReceivables.d31_60 + rental.rentalReceivables.d60_plus
    if (bigRentalOverdue > 0) items.push({ level: 'orange', text: 'Overdue Rental Payments (30+ days)', count: 1 })
    return items
  }, [overdueReceivablesCount, jobStats.delayed.length, stockAlerts, expenseSummary.unusual, estimatesAwaiting, rental])

  // ---------- AI Executive Briefing (deterministic, data-grounded -- no LLM call on load) ----------
  const briefing = useMemo(() => {
    if (isLoading) return null
    const headline = attentionItems.some((a) => a.level === 'red') ? 'Business needs attention in a few areas below.' : 'Business is performing normally.'
    const observations: string[] = []
    if (pnl.revenueChangePct !== null) observations.push(`Revenue is up ${Math.abs(Math.round(pnl.revenueChangePct))}% compared with last month.`)
    if (pnl.expenseChangePct !== null) observations.push(`Expenses ${pnl.expenseChangePct >= 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(pnl.expenseChangePct))}% this month.`)
    observations.push(
      overdueReceivablesCount > 0
        ? `${overdueReceivablesCount} customer payment${overdueReceivablesCount === 1 ? '' : 's'} overdue, totalling ${fmtCompact(receivables.d1_30 + receivables.d31_60 + receivables.d60_plus)}.`
        : 'No overdue customer payments.',
    )
    observations.push(`${jobStats.active.length} repair job${jobStats.active.length === 1 ? ' is' : 's are'} currently active${jobStats.pending.length > 0 ? `, ${jobStats.pending.length} pending` : ''}.`)
    if ((stockAlerts ?? []).length > 0) observations.push(`${stockAlerts!.length} inventory item${stockAlerts!.length === 1 ? '' : 's'} require attention.`)
    if (rental.utilization !== null) observations.push(`Machine rental utilisation is ${Math.round(rental.utilization)}%.`)
    return { headline, observations }
  }, [isLoading, attentionItems, pnl.revenueChangePct, pnl.expenseChangePct, overdueReceivablesCount, receivables, jobStats, stockAlerts, rental])

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
    <div className="space-y-5">
      <PageHeader
        title="CEO Dashboard"
        description={greeting()}
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

      {/* ---------- 1. KPI Strip ---------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={CircleDollarSign} iconColor="var(--primary)" label="Revenue" value={fmtCompact(pnl.revenue)} trendPct={pnl.revenueChangePct} sparkline={trendData.map((d) => d.revenue)} />
        <KpiCard
          icon={ReceiptText}
          iconColor="var(--chart-1)"
          label="Expenses"
          value={fmtCompact(pnl.totalExpense)}
          trendPct={pnl.expenseChangePct}
          invertTrendColor
          sparkline={trendData.map((d) => d.expense)}
        />
        <KpiCard
          icon={ShieldCheck}
          iconColor="var(--chart-success)"
          label="Profit / Margin"
          value={fmtCompact(pnl.profit)}
          sub={`${pnl.margin.toFixed(1)}% Margin`}
          tone={pnl.profit >= 0 ? 'good' : 'bad'}
          trendPct={pnl.profitChangePct}
          sparkline={trendData.map((d) => d.profit)}
        />
        <KpiCard icon={Landmark} iconColor="var(--chart-5)" label="Cash &amp; Bank Balance" value={fmtCompact(cash.total)} />
        <KpiCard icon={Users} iconColor="var(--chart-2)" label="Outstanding Receivables" value={fmtCompact(receivables.total)} tone={overdueReceivablesCount > 0 ? 'bad' : undefined} />
        <KpiCard icon={Users} iconColor="var(--chart-3)" label="Outstanding Payables" value={fmtCompact(payables.total)} />
        <KpiCard icon={Briefcase} iconColor="var(--chart-1)" label="Active Repair Jobs" value={String(jobStats.active.length)} />
        <KpiCard
          icon={Banknote}
          iconColor="var(--chart-critical)"
          label="Pending Customer Payments"
          value={String((invoices ?? []).filter((i) => i.total - i.amount_received > 0.01).length)}
        />
      </div>

      {/* ---------- 2/3/4. Briefing / Attention / Repair Performance ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/[0.04]">
          <CardHeader>
            <CardTitle className="text-base">AI Business Briefing</CardTitle>
          </CardHeader>
          <CardContent>
            {briefing ? (
              <div className="space-y-2">
                <Badge variant="default" className="bg-chart-success text-white">
                  {briefing.headline}
                </Badge>
                <ul className="space-y-1.5 pt-1">
                  {briefing.observations.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading business data...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Needs Your Attention</CardTitle>
              {attentionItems.length > 0 && <Badge variant="destructive">{attentionItems.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {attentionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exceptions right now.</p>
            ) : (
              attentionItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className={item.level === 'red' ? 'text-chart-critical' : 'text-chart-warning'}>{item.level === 'red' ? '🔴' : '🟠'}</span>
                    {item.text}
                  </span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repair Business Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile icon={Briefcase} iconColor="var(--primary)" label="Active" value={String(jobStats.active.length)} />
              <StatTile icon={ShieldCheck} iconColor="var(--chart-success)" label="Completed" value={String(jobStats.completed.length)} />
              <StatTile icon={ReceiptText} iconColor="var(--chart-1)" label="Pending" value={String(jobStats.pending.length)} />
              <StatTile icon={AlertTriangle} iconColor="var(--chart-critical)" label="Delayed" value={String(jobStats.delayed.length)} tone={jobStats.delayed.length > 0 ? 'bad' : undefined} />
              <StatTile icon={ShieldCheck} iconColor="var(--chart-5)" label="Awaiting Approval" value={String(estimatesAwaiting ?? 0)} />
              <StatTile icon={ReceiptText} iconColor="var(--chart-1)" label="Awaiting Material" value="N/A" muted />
              <StatTile icon={Wrench} iconColor="var(--chart-2)" label="Awaiting Testing" value={String(jobStats.awaitingTesting.length)} />
              <StatTile icon={Truck} iconColor="var(--chart-success)" label="Ready for Delivery" value={String(jobStats.readyForDelivery.length)} />
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Average Job Value</p>
                <p className="font-semibold text-foreground">{jobStats.avgJobValue !== null ? fmt(jobStats.avgJobValue) : 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average Repair Time</p>
                <p className="font-semibold text-foreground">{jobStats.avgRepairDays !== null ? `${jobStats.avgRepairDays.toFixed(1)} days` : 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Job Profitability</p>
                <p className="font-semibold text-foreground">{jobStats.profitability.length > 0 ? 'See table below' : 'Not available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- 5. Revenue vs Expenses vs Profit + Job Profitability + Expense Summary + Cash ---------- */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Expenses vs Profit</CardTitle>
            <p className="text-xs text-muted-foreground">Monthly, last 6 months</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-56 w-full">
              <LineChart data={trendData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={50} tickFormatter={(v) => fmtCompact(v)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Job Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            {jobStats.profitability.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No job financial data available for the selected period.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobStats.profitability.map((r) => (
                    <TableRow key={r.job}>
                      <TableCell className="font-medium">{r.job}</TableCell>
                      <TableCell className="text-right">{fmtCompact(r.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseSummary.donutData.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No expenses recorded.</p>
            ) : (
              <>
                <ChartContainer config={{}} className="mx-auto aspect-square h-32">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={expenseSummary.donutData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={56} strokeWidth={2}>
                      {expenseSummary.donutData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 space-y-1">
                  {expenseSummary.donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="min-w-0 flex-1 truncate text-foreground">{d.name}</span>
                      <span className="text-muted-foreground">{expenseSummary.currentTotal > 0 ? `${Math.round((d.value / expenseSummary.currentTotal) * 100)}%` : '0%'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Cash in Hand" value={cash.cashBalance !== null ? fmt(cash.cashBalance) : 'N/A'} />
            <Row label="Bank Balance" value={cash.bankBalance !== null ? fmt(cash.bankBalance) : 'N/A'} />
            <Row label="Today's Collections" value={fmt(cash.collections)} />
            <Row label="Today's Payments" value={fmt(cash.payments)} />
            <Row label="Net Cash Flow" value={fmt(cash.net)} bold tone={cash.net >= 0 ? 'good' : 'bad'} />
          </CardContent>
        </Card>
      </div>

      {/* ---------- 6/7. Machine Rental Revenue + Comparison + right column ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/[0.03] to-transparent lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Machine Rental Revenue</CardTitle>
              <span className="text-xs text-muted-foreground">{DASHBOARD_PERIOD_LABELS[period]}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{fmtCompact(rental.rentalRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total Rental Revenue</p>
            {rental.sixMonthChangePct !== null ? (
              <Badge variant={rental.sixMonthChangePct >= 0 ? 'default' : 'destructive'} className="mt-2 gap-1">
                {rental.sixMonthChangePct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(rental.sixMonthChangePct).toFixed(1)}% vs Previous 6 Months
              </Badge>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No prior 6-month data to compare</p>
            )}
            <ChartContainer config={rentalHeroConfig} className="mt-4 h-40 w-full">
              <AreaChart data={trendData.length ? rentalComparisonData.map((d) => ({ month: d.month, revenue: d.current })) : []}>
                <defs>
                  <linearGradient id="rentalHeroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} fill="url(#rentalHeroFill)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Rental Revenue Comparison &mdash; Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={rentalComparisonConfig} className="h-56 w-full">
              <BarChart data={rentalComparisonData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={50} tickFormatter={(v) => fmtCompact(v)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" fill="var(--color-previous)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-1">
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
      </div>

      {/* ---------- Machine Rental Insights (utilisation, top machines, maintenance, current rentals) ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Machine Rental Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile icon={Truck} iconColor="var(--primary)" label="Total Machines" value={String(rental.total)} />
            <StatTile icon={ShieldCheck} iconColor="var(--chart-success)" label="Available" value={String(rental.available)} />
            <StatTile icon={Truck} iconColor="var(--chart-2)" label="Currently Rented" value={String(rental.rented)} />
            <StatTile icon={AlertTriangle} iconColor="var(--chart-critical)" label="Under Maintenance" value={String(rental.maintenance)} tone={rental.maintenance > 0 ? 'bad' : undefined} />
          </div>

          {rental.utilization !== null && (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">Machine Utilisation</span>
                <span className="text-2xl font-bold text-foreground">{Math.round(rental.utilization)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, rental.utilization)}%` }} />
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Top Revenue-Generating Machines</p>
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
            </div>

            {rental.currentRentals.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Current Rentals</p>
                <p className="mb-2 text-xs text-muted-foreground">Confirmed bookings, not yet completed/cancelled. Return dates omitted -- underlying data isn't reliable.</p>
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
              </div>
            )}
          </div>

          {rental.maintenanceAssets.length > 0 && (
            <div className="space-y-1 border-t border-border pt-3">
              <p className="mb-1 text-sm font-medium text-foreground">Maintenance Alert</p>
              {rental.maintenanceAssets.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-3.5 text-chart-warning" />
                  <span>
                    {a.name} ({a.asset_code}) — currently under maintenance
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/[0.04]">
        <CardHeader>
          <CardTitle className="text-base">AI Rental Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">{rentalInsight ?? 'Loading...'}</p>
        </CardContent>
      </Card>

      {/* ---------- Ask TransformerFlow AI ---------- */}
      <AskAiBox />

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Last updated: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>All data is live and reflects actual business transactions.</span>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  tone,
  icon: Icon,
  iconColor,
  muted,
  trendPct,
  invertTrendColor,
  sparkline,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'good' | 'bad'
  icon?: typeof Wrench
  iconColor?: string
  muted?: boolean
  trendPct?: number | null
  invertTrendColor?: boolean
  sparkline?: number[]
}) {
  const trendIsGood = trendPct == null ? null : invertTrendColor ? trendPct <= 0 : trendPct >= 0
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-center justify-between">
          {Icon && (
            <span className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, ${iconColor} 15%, transparent)` }}>
              <Icon className="size-4" style={{ color: iconColor }} />
            </span>
          )}
          {trendPct != null && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${trendIsGood ? 'text-chart-success' : 'text-chart-critical'}`}>
              {trendPct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(trendPct).toFixed(1)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-semibold ${muted ? 'text-muted-foreground' : tone === 'good' ? 'text-chart-success' : tone === 'bad' ? 'text-chart-critical' : 'text-foreground'}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {sparkline && sparkline.length > 1 && <Sparkline values={sparkline} positive={trendIsGood ?? true} />}
      </CardContent>
    </Card>
  )
}

/** Minimal dependency-free SVG sparkline -- only rendered when we actually have a real
 * multi-month series behind it (revenue/expense/profit), never fabricated for point-in-time
 * balances like receivables/payables/cash. */
function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const width = 100
  const height = 24
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-6 w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={positive ? 'var(--chart-success)' : 'var(--chart-critical)'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatTile({ label, value, tone, icon: Icon, iconColor, muted }: { label: string; value: string; tone?: 'bad'; icon?: typeof Wrench; iconColor?: string; muted?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-2.5">
      <div className="flex items-center gap-1.5">
        {Icon && (
          <span className="flex size-5 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in oklab, ${iconColor} 15%, transparent)` }}>
            <Icon className="size-3" style={{ color: iconColor }} />
          </span>
        )}
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`mt-1 text-lg font-semibold ${muted ? 'text-muted-foreground' : tone === 'bad' ? 'text-chart-critical' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? `font-semibold ${tone === 'good' ? 'text-chart-success' : tone === 'bad' ? 'text-chart-critical' : 'text-foreground'}` : 'text-foreground'}>{value}</span>
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

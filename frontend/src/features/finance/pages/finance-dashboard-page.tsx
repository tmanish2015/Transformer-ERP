import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { AlertCircle, BookOpenCheck, Coins, IndianRupee, Landmark, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useLedgerLines } from '@/features/finance/hooks/use-ledger-lines'
import { useChartOfAccounts } from '@/features/finance/hooks/use-chart-of-accounts'
import { useJournalEntries } from '@/features/finance/hooks/use-journal-entries'
import { categoricalColor } from '@/lib/chart-colors'

const pnlConfig = {
  income: { label: 'Income', color: 'var(--chart-success)' },
  expense: { label: 'Expense', color: 'var(--chart-critical)' },
} satisfies ChartConfig

export function FinanceDashboardPage() {
  const { data: lines, isLoading } = useLedgerLines()
  const { data: accounts } = useChartOfAccounts()
  const { data: entries } = useJournalEntries()

  const postedLines = useMemo(() => (lines ?? []).filter((l) => l.journal_entry && l.journal_entry.status === 'posted'), [lines])

  const netFor = useCallback(
    (code: string) => {
      const account = (accounts ?? []).find((a) => a.code === code)
      if (!account) return 0
      const opening = account.opening_balance_type === 'debit' ? account.opening_balance : -account.opening_balance
      const movement = postedLines.filter((l) => l.account_id === account.id).reduce((s, l) => s + l.debit - l.credit, 0)
      return opening + movement
    },
    [accounts, postedLines],
  )

  const stats = useMemo(() => {
    const cashBalance = netFor('1001')
    const bankBalance = netFor('1002')
    const receivables = netFor('1003')
    const payables = -netFor('2001')
    const gstPayable = -netFor('2002') + netFor('1004')
    const pendingApprovals = (entries ?? []).filter((e) => e.approval_status === 'pending').length

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const income = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'income')
    const expense = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'expense')
    const sumInRange = (accountIds: string[]) => postedLines.filter((l) => accountIds.includes(l.account_id) && l.journal_entry!.entry_date >= monthStart).reduce((s, l) => s + l.credit - l.debit, 0)
    const monthIncome = sumInRange(income.map((a) => a.id))
    const monthExpense = -sumInRange(expense.map((a) => a.id))
    const netProfit = monthIncome - monthExpense

    return { cashBalance, bankBalance, receivables, payables, gstPayable, pendingApprovals, netProfit }
  }, [accounts, postedLines, entries, netFor])

  const pnlTrend = useMemo(() => {
    const months: { key: string; label: string }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-IN', { month: 'short' }) })
    }
    const incomeIds = new Set((accounts ?? []).filter((a) => !a.is_group && a.account_type === 'income').map((a) => a.id))
    const expenseIds = new Set((accounts ?? []).filter((a) => !a.is_group && a.account_type === 'expense').map((a) => a.id))

    return months.map(({ key, label }) => {
      const monthLines = postedLines.filter((l) => l.journal_entry!.entry_date.startsWith(key))
      const income = monthLines.filter((l) => incomeIds.has(l.account_id)).reduce((s, l) => s + l.credit - l.debit, 0)
      const expense = monthLines.filter((l) => expenseIds.has(l.account_id)).reduce((s, l) => s + l.debit - l.credit, 0)
      return { label, income: Math.round(income), expense: Math.round(expense) }
    })
  }, [accounts, postedLines])

  const expenseBreakdown = useMemo(() => {
    const expenseAccounts = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'expense')
    return expenseAccounts
      .map((a) => ({ name: a.name, value: Math.round(postedLines.filter((l) => l.account_id === a.id).reduce((s, l) => s + l.debit - l.credit, 0)) }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [accounts, postedLines])

  const recentActivity = useMemo(() => (entries ?? []).slice(0, 8), [entries])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Dashboard"
        description="Cash position, receivables, payables, and profitability at a glance."
        actions={
          <Button render={<Link to="/finance/reports" />} nativeButton={false}>
            <BookOpenCheck /> View Reports
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Cash Balance" value={`₹${stats.cashBalance.toLocaleString('en-IN')}`} icon={Coins} />
            <KpiCard label="Bank Balance" value={`₹${stats.bankBalance.toLocaleString('en-IN')}`} icon={Landmark} />
            <KpiCard label="Receivables Outstanding" value={`₹${stats.receivables.toLocaleString('en-IN')}`} icon={TrendingUp} />
            <KpiCard label="Payables Outstanding" value={`₹${stats.payables.toLocaleString('en-IN')}`} icon={TrendingDown} tone={stats.payables > 0 ? 'warning' : 'default'} />
            <KpiCard label="Net Profit (This Month)" value={`₹${stats.netProfit.toLocaleString('en-IN')}`} icon={IndianRupee} tone={stats.netProfit >= 0 ? 'success' : 'destructive'} />
            <KpiCard label="GST Payable" value={`₹${stats.gstPayable.toLocaleString('en-IN')}`} icon={ReceiptText} tone={stats.gstPayable > 0 ? 'warning' : 'default'} />
            <KpiCard label="Pending Approvals" value={String(stats.pendingApprovals)} icon={AlertCircle} tone={stats.pendingApprovals > 0 ? 'warning' : 'default'} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Income vs Expense (6 Months)</CardTitle>
            <CardDescription>Monthly income and expense trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pnlConfig} className="h-52 w-full">
              <BarChart data={pnlTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={50} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses recorded yet.</p>
            ) : (
              <ChartContainer config={{}} className="mx-auto aspect-square h-48">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={45}>
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={categoricalColor(index)} />
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
          <CardTitle className="text-base">Recent Financial Activity</CardTitle>
          <CardDescription>Most recent vouchers and journal entries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
          {recentActivity.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {e.entry_number}
                  {e.narration ? ` · ${e.narration}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(e.entry_date).toLocaleDateString()}</p>
              </div>
              <Badge variant="secondary" className="shrink-0 capitalize">
                {e.voucher_type}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

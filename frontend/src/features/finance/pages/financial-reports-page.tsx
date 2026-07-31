import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useLedgerLines } from '@/features/finance/hooks/use-ledger-lines'
import { useChartOfAccounts } from '@/features/finance/hooks/use-chart-of-accounts'

const cashFlowConfig = {
  inflow: { label: 'Inflow', color: 'var(--chart-success)' },
  outflow: { label: 'Outflow', color: 'var(--chart-critical)' },
} satisfies ChartConfig

function startOfFinancialYear(): string {
  const now = new Date()
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${year}-04-01`
}

export function FinancialReportsPage() {
  const { data: lines } = useLedgerLines()
  const { data: accounts } = useChartOfAccounts()

  const [fromDate, setFromDate] = useState(startOfFinancialYear())
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))

  const postedLines = useMemo(() => (lines ?? []).filter((l) => l.journal_entry && l.journal_entry.status === 'posted'), [lines])

  const trialBalance = useMemo(() => {
    return (accounts ?? [])
      .filter((a) => !a.is_group)
      .map((a) => {
        const opening = a.opening_balance_type === 'debit' ? a.opening_balance : -a.opening_balance
        const movement = postedLines.filter((l) => l.account_id === a.id && l.journal_entry!.entry_date <= toDate).reduce((sum, l) => sum + l.debit - l.credit, 0)
        const net = opening + movement
        return { code: a.code, name: a.name, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 }
      })
      .filter((r) => r.debit !== 0 || r.credit !== 0)
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [accounts, postedLines, toDate])

  const totalDebit = trialBalance.reduce((s, r) => s + r.debit, 0)
  const totalCredit = trialBalance.reduce((s, r) => s + r.credit, 0)

  const profitAndLoss = useMemo(() => {
    const income = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'income')
    const expense = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'expense')

    const sumFor = (accountId: string) =>
      postedLines.filter((l) => l.account_id === accountId && l.journal_entry!.entry_date >= fromDate && l.journal_entry!.entry_date <= toDate).reduce((sum, l) => sum + l.credit - l.debit, 0)

    const incomeRows = income.map((a) => ({ name: a.name, amount: sumFor(a.id) })).filter((r) => r.amount !== 0)
    const expenseRows = expense.map((a) => ({ name: a.name, amount: -sumFor(a.id) })).filter((r) => r.amount !== 0)
    const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0)
    const totalExpense = expenseRows.reduce((s, r) => s + r.amount, 0)
    return { incomeRows, expenseRows, totalIncome, totalExpense, netProfit: totalIncome - totalExpense }
  }, [accounts, postedLines, fromDate, toDate])

  const balanceSheet = useMemo(() => {
    const assets = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'asset')
    const liabilities = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'liability')
    const equity = (accounts ?? []).filter((a) => !a.is_group && a.account_type === 'equity')

    const netFor = (a: (typeof assets)[number]) => {
      const opening = a.opening_balance_type === 'debit' ? a.opening_balance : -a.opening_balance
      const movement = postedLines.filter((l) => l.account_id === a.id && l.journal_entry!.entry_date <= toDate).reduce((s, l) => s + l.debit - l.credit, 0)
      return opening + movement
    }

    const assetRows = assets.map((a) => ({ name: a.name, amount: netFor(a) })).filter((r) => r.amount !== 0)
    const liabilityRows = liabilities.map((a) => ({ name: a.name, amount: -netFor(a) })).filter((r) => r.amount !== 0)
    const equityRows = equity.map((a) => ({ name: a.name, amount: -netFor(a) })).filter((r) => r.amount !== 0)

    // retained earnings (net P&L since inception) plugs the equity side so both sides tie out
    const totalAssets = assetRows.reduce((s, r) => s + r.amount, 0)
    const totalLiabilities = liabilityRows.reduce((s, r) => s + r.amount, 0)
    const explicitEquity = equityRows.reduce((s, r) => s + r.amount, 0)
    const retainedEarnings = totalAssets - totalLiabilities - explicitEquity

    return { assetRows, liabilityRows, equityRows, totalAssets, totalLiabilities, retainedEarnings }
  }, [accounts, postedLines, toDate])

  const cashFlow = useMemo(() => {
    const cashBankIds = new Set((accounts ?? []).filter((a) => a.code === '1001' || a.code === '1002').map((a) => a.id))
    const inRange = postedLines.filter((l) => cashBankIds.has(l.account_id) && l.journal_entry!.entry_date >= fromDate && l.journal_entry!.entry_date <= toDate)
    const inflow = inRange.reduce((s, l) => s + l.debit, 0)
    const outflow = inRange.reduce((s, l) => s + l.credit, 0)
    return { inflow, outflow, net: inflow - outflow, chartData: [{ label: 'Cash Flow', inflow, outflow }] }
  }, [accounts, postedLines, fromDate, toDate])

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports" description="Trial balance, profit & loss, balance sheet, and cash flow statements." />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="from-date">From</Label>
          <Input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to-date">To</Label>
          <Input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-44" />
        </div>
      </div>

      <Tabs defaultValue="trial-balance">
        <TabsList>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="pnl">Profit &amp; Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="mt-4 space-y-3">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance.map((r) => (
                  <TableRow key={r.code}>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="text-right">{r.debit > 0 ? `₹${r.debit.toLocaleString('en-IN')}` : '—'}</TableCell>
                    <TableCell className="text-right">{r.credit > 0 ? `₹${r.credit.toLocaleString('en-IN')}` : '—'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">₹{totalDebit.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">₹{totalCredit.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pnl" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Income</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {profitAndLoss.incomeRows.map((r) => (
                      <TableRow key={r.name}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">₹{r.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Total Income</TableCell>
                      <TableCell className="text-right">₹{profitAndLoss.totalIncome.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {profitAndLoss.expenseRows.map((r) => (
                      <TableRow key={r.name}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">₹{r.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right">₹{profitAndLoss.totalExpense.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardContent className="flex items-center justify-between py-4">
              <span className="text-base font-semibold">Net Profit</span>
              <span className={`text-lg font-bold ${profitAndLoss.netProfit >= 0 ? 'text-chart-success' : 'text-chart-critical'}`}>₹{profitAndLoss.netProfit.toLocaleString('en-IN')}</span>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {balanceSheet.assetRows.map((r) => (
                      <TableRow key={r.name}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">₹{r.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right">₹{balanceSheet.totalAssets.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Liabilities &amp; Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {balanceSheet.liabilityRows.map((r) => (
                      <TableRow key={r.name}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">₹{r.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    {balanceSheet.equityRows.map((r) => (
                      <TableRow key={r.name}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">₹{r.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>Retained Earnings</TableCell>
                      <TableCell className="text-right">₹{balanceSheet.retainedEarnings.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold">
                      <TableCell>Total Liabilities &amp; Equity</TableCell>
                      <TableCell className="text-right">₹{balanceSheet.totalAssets.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cash-flow" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Cash Inflow</p>
                <p className="text-lg font-semibold text-chart-success">₹{cashFlow.inflow.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Cash Outflow</p>
                <p className="text-lg font-semibold text-chart-critical">₹{cashFlow.outflow.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                <p className="text-lg font-semibold text-foreground">₹{cashFlow.net.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cash In vs Out</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cashFlowConfig} className="h-64 w-full">
                <BarChart data={cashFlow.chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={50} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="inflow" fill="var(--color-inflow)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="outflow" fill="var(--color-outflow)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

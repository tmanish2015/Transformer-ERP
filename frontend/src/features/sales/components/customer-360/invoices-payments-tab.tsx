import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, IndianRupee, ReceiptText } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { KpiCard } from '@/components/shared/kpi-card'
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS, outstandingAmount, type SalesInvoice, type SalesPayment } from '@/features/sales/types/sales-types'

interface InvoicesPaymentsTabProps {
  customerId: string
  invoices: SalesInvoice[] | undefined
  payments: (SalesPayment & { sales_invoice: { invoice_number: string } })[] | undefined
}

export function InvoicesPaymentsTab({ invoices, payments }: InvoicesPaymentsTabProps) {
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const total = (invoices ?? []).length
    const paid = (invoices ?? []).filter((i) => i.status === 'paid').length
    const unpaidValue = (invoices ?? []).reduce((s, i) => s + outstandingAmount(i), 0)
    return { total, paid, unpaidValue }
  }, [invoices])

  if ((invoices ?? []).length === 0 && (payments ?? []).length === 0) {
    return <EmptyState icon={FileText} title="No invoices or payments" description="This customer has no invoices or payments on record." />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total Invoices" value={String(stats.total)} icon={ReceiptText} />
        <KpiCard label="Fully Paid" value={String(stats.paid)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Outstanding" value={`₹${stats.unpaidValue.toLocaleString('en-IN')}`} icon={IndianRupee} tone={stats.unpaidValue > 0 ? 'destructive' : 'default'} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3 text-sm font-medium text-foreground">Invoices</div>
        {(invoices ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No invoices recorded for this customer.</p>
        ) : (
          <div className="divide-y divide-border">
            {(invoices ?? []).map((inv) => (
              <button key={inv.id} type="button" onClick={() => navigate('/sales/invoices')} className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left text-sm hover:bg-muted/50">
                <span className="text-foreground">{inv.invoice_number}</span>
                <span className="text-muted-foreground">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</span>
                <span className="text-muted-foreground">₹{inv.total.toLocaleString('en-IN')}</span>
                <span className="text-muted-foreground">Balance: ₹{outstandingAmount(inv).toLocaleString('en-IN')}</span>
                <StatusBadge status={inv.status} label={INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS] ?? inv.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3 text-sm font-medium text-foreground">Payment History</div>
        {(payments ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No payments recorded for this customer.</p>
        ) : (
          <div className="divide-y divide-border">
            {(payments ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span className="text-foreground">{p.sales_invoice.invoice_number}</span>
                <span className="text-muted-foreground">{new Date(p.payment_date).toLocaleDateString('en-IN')}</span>
                <span className="text-muted-foreground">₹{p.amount.toLocaleString('en-IN')}</span>
                <span className="text-muted-foreground">{PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Customer, SalesInvoice, SalesOrder, SalesPayment } from '@/features/sales/types/sales-types'
import { outstandingAmount } from '@/features/sales/types/sales-types'

interface CommercialTabProps {
  customerId: string
  customer: Customer
  orders: SalesOrder[] | undefined
  invoices: SalesInvoice[] | undefined
  payments: (SalesPayment & { sales_invoice: { invoice_number: string } })[] | undefined
}

function ageingBucket(dueDate: string | null, today: number): '0-30' | '31-60' | '61-90' | '90+' {
  const due = dueDate ? new Date(dueDate).getTime() : today
  const daysPastDue = Math.max(0, Math.floor((today - due) / 86400000))
  if (daysPastDue <= 30) return '0-30'
  if (daysPastDue <= 60) return '31-60'
  if (daysPastDue <= 90) return '61-90'
  return '90+'
}

export function CommercialTab({ customer, orders, invoices, payments }: CommercialTabProps) {
  const today = Date.now()

  const ageing = useMemo(() => {
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    for (const inv of invoices ?? []) {
      const balance = outstandingAmount(inv)
      if (balance <= 0) continue
      buckets[ageingBucket(inv.due_date, today)] += balance
    }
    return buckets
  }, [invoices, today])

  const highlights = useMemo(() => {
    const orderCount = (orders ?? []).length
    const totalOrderValue = (orders ?? []).reduce((s, o) => s + o.total, 0)
    const avgOrderValue = orderCount > 0 ? totalOrderValue / orderCount : null
    const lastOrderDate = orderCount > 0 ? [...(orders ?? [])].sort((a, b) => b.order_date.localeCompare(a.order_date))[0].order_date : null
    const lastPaymentDate = (payments ?? []).length > 0 ? [...(payments ?? [])].sort((a, b) => b.payment_date.localeCompare(a.payment_date))[0].payment_date : null
    return { orderCount, avgOrderValue, lastOrderDate, lastPaymentDate }
  }, [orders, payments])

  const totalOutstanding = ageing['0-30'] + ageing['31-60'] + ageing['61-90'] + ageing['90+']

  return (
    <div className="space-y-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">Receivable Ageing</CardTitle>
        </CardHeader>
        <CardContent>
          {totalOutstanding === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No outstanding receivables.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(['0-30', '31-60', '61-90', '90+'] as const).map((bucket) => (
                <div key={bucket} className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">{bucket} days</p>
                  <p className={`mt-1 text-lg font-semibold ${bucket === '90+' && ageing[bucket] > 0 ? 'text-chart-critical' : 'text-foreground'}`}>
                    ₹{ageing[bucket].toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">Customer Highlights</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Customer Since</p>
            <p className="text-foreground">{customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : 'Not available'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-foreground">{highlights.orderCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average Order Value</p>
            <p className="text-foreground">{highlights.avgOrderValue != null ? `₹${highlights.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Not available'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Order Date</p>
            <p className="text-foreground">{highlights.lastOrderDate ? new Date(highlights.lastOrderDate).toLocaleDateString('en-IN') : 'Not available'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Payment Date</p>
            <p className="text-foreground">{highlights.lastPaymentDate ? new Date(highlights.lastPaymentDate).toLocaleDateString('en-IN') : 'Not available'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Credit Limit / Days</p>
            <p className="text-foreground">₹{customer.credit_limit.toLocaleString('en-IN')} / {customer.credit_days} days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

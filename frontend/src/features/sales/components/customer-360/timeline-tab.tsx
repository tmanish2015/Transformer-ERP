import { useMemo } from 'react'
import { History } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCustomer360Opportunities,
  useCustomer360RentalAgreements,
  useCustomer360SiteSurveys,
  useCustomer360TestReports,
} from '@/features/sales/hooks/use-customer-360'
import type { SalesInvoice, SalesOrder, SalesPayment } from '@/features/sales/types/sales-types'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'
import type { RepairJob } from '@/features/workshop/types/workshop-types'

interface TimelineTabProps {
  customerId: string
  active: boolean
  customerCreatedAt: string
  orders: SalesOrder[] | undefined
  invoices: SalesInvoice[] | undefined
  payments: (SalesPayment & { sales_invoice: { invoice_number: string } })[] | undefined
  rentalBookings: RentalBookingWithRelations[] | undefined
  repairJobs: RepairJob[] | undefined
}

interface TimelineEvent {
  date: string
  label: string
}

export function TimelineTab({ customerId, active, customerCreatedAt, orders, invoices, payments, rentalBookings, repairJobs }: TimelineTabProps) {
  const { data: opportunities, isLoading: oppLoading } = useCustomer360Opportunities(customerId, active)
  const { data: siteSurveys, isLoading: surveyLoading } = useCustomer360SiteSurveys(customerId, active)
  const { data: testReports, isLoading: testLoading } = useCustomer360TestReports(customerId, active)
  const { data: agreements, isLoading: agreementsLoading } = useCustomer360RentalAgreements(customerId, active)

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = []
    list.push({ date: customerCreatedAt, label: 'Customer added' })
    for (const o of orders ?? []) list.push({ date: o.created_at, label: `Sales Order ${o.so_number} created` })
    for (const inv of invoices ?? []) list.push({ date: inv.created_at, label: `Invoice ${inv.invoice_number} raised for ₹${inv.total.toLocaleString('en-IN')}` })
    for (const p of payments ?? []) list.push({ date: p.created_at, label: `Payment received ₹${p.amount.toLocaleString('en-IN')} against ${p.sales_invoice.invoice_number}` })
    for (const b of rentalBookings ?? []) {
      list.push({ date: b.created_at, label: `Rental booking ${b.booking_number} created` })
      if (b.status === 'completed' && b.end_date) list.push({ date: b.end_date, label: `Rental booking ${b.booking_number} returned` })
    }
    for (const job of repairJobs ?? []) list.push({ date: job.created_at, label: `Repair job ${job.job_number} logged` })
    for (const opp of opportunities ?? []) list.push({ date: opp.created_at, label: `Opportunity "${opp.title}" created` })
    for (const survey of siteSurveys ?? []) list.push({ date: survey.created_at, label: `Site survey ${survey.survey_number} scheduled` })
    for (const report of testReports ?? []) list.push({ date: report.created_at, label: `Test report ${report.report_number} recorded` })
    for (const agreement of agreements ?? []) list.push({ date: agreement.created_at, label: `Rental agreement created` })
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [customerCreatedAt, orders, invoices, payments, rentalBookings, repairJobs, opportunities, siteSurveys, testReports, agreements])

  if (oppLoading || surveyLoading || testLoading || agreementsLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  if (events.length === 0) {
    return <EmptyState icon={History} title="No activity yet" description="This customer has no recorded activity." />
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="divide-y divide-border">
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-3 p-3 text-sm">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="text-foreground">{event.label}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

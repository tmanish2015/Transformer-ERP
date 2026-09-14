import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { KpiCard } from '@/components/shared/kpi-card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileSearch, Handshake, Quote, ShoppingCart } from 'lucide-react'
import {
  useCustomer360Opportunities,
  useCustomer360Quotations,
  useCustomer360SalesOrders,
  useCustomer360SiteSurveys,
} from '@/features/sales/hooks/use-customer-360'
import { OPPORTUNITY_STAGE_LABELS } from '@/features/crm/types/crm-types'
import { QUOTATION_STATUS_LABELS, SO_STATUS_LABELS } from '@/features/sales/types/sales-types'
import { StatusBadge } from '@/components/shared/status-badge'

interface SalesPipelineTabProps {
  customerId: string
  active: boolean
}

export function SalesPipelineTab({ customerId, active }: SalesPipelineTabProps) {
  const navigate = useNavigate()
  const { data: opportunities, isLoading: oppLoading } = useCustomer360Opportunities(customerId, active)
  const { data: siteSurveys, isLoading: surveyLoading } = useCustomer360SiteSurveys(customerId, active)
  const { data: quotations, isLoading: quoteLoading } = useCustomer360Quotations(customerId, active)
  const { data: orders } = useCustomer360SalesOrders(customerId)

  const stats = useMemo(() => {
    const openOpportunities = (opportunities ?? []).filter((o) => !['won', 'lost'].includes(o.stage))
    const openOpportunityValue = openOpportunities.reduce((s, o) => s + o.estimated_value, 0)
    const pendingQuotations = (quotations ?? []).filter((q) => ['draft', 'pending_approval', 'sent'].includes(q.status))
    const won = (opportunities ?? []).filter((o) => o.stage === 'won').length
    const lost = (opportunities ?? []).filter((o) => o.stage === 'lost').length
    return {
      openSiteSurveys: (siteSurveys ?? []).filter((s) => s.status === 'scheduled').length,
      openOpportunitiesCount: openOpportunities.length,
      openOpportunityValue,
      pendingQuotationsCount: pendingQuotations.length,
      salesOrdersCount: (orders ?? []).length,
      won,
      lost,
    }
  }, [opportunities, siteSurveys, quotations, orders])

  if (oppLoading || surveyLoading || quoteLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open Opportunities" value={`${stats.openOpportunitiesCount} (₹${stats.openOpportunityValue.toLocaleString('en-IN')})`} icon={Handshake} />
        <KpiCard label="Open Site Surveys" value={String(stats.openSiteSurveys)} icon={FileSearch} />
        <KpiCard label="Pending Quotations" value={String(stats.pendingQuotationsCount)} icon={Quote} />
        <KpiCard label="Sales Orders" value={String(stats.salesOrdersCount)} icon={ShoppingCart} />
      </div>
      <p className="text-sm text-muted-foreground">Won: {stats.won} · Lost: {stats.lost}</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-3 text-sm font-medium text-foreground">Opportunities</div>
          {(opportunities ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No opportunities recorded for this customer.</p>
          ) : (
            <div className="divide-y divide-border">
              {(opportunities ?? []).map((o) => (
                <button key={o.id} type="button" onClick={() => navigate('/crm/opportunities')} className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50">
                  <span className="text-foreground">{o.title}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">₹{o.estimated_value.toLocaleString('en-IN')}</span>
                    <StatusBadge status={o.stage} label={OPPORTUNITY_STAGE_LABELS[o.stage as keyof typeof OPPORTUNITY_STAGE_LABELS] ?? o.stage} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-3 text-sm font-medium text-foreground">Quotations</div>
          {(quotations ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No quotations recorded for this customer.</p>
          ) : (
            <div className="divide-y divide-border">
              {(quotations ?? []).map((q) => (
                <button key={q.id} type="button" onClick={() => navigate('/sales/quotations')} className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50">
                  <span className="text-foreground">{q.quotation_number}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">₹{q.total.toLocaleString('en-IN')}</span>
                    <StatusBadge status={q.status} label={QUOTATION_STATUS_LABELS[q.status as keyof typeof QUOTATION_STATUS_LABELS] ?? q.status} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3 text-sm font-medium text-foreground">Sales Orders</div>
        {(orders ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No sales orders recorded for this customer.</p>
        ) : (
          <div className="divide-y divide-border">
            {(orders ?? []).map((o) => (
              <button key={o.id} type="button" onClick={() => navigate('/sales/orders')} className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50">
                <span className="text-foreground">{o.so_number}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">₹{o.total.toLocaleString('en-IN')}</span>
                  <StatusBadge status={o.status} label={SO_STATUS_LABELS[o.status as keyof typeof SO_STATUS_LABELS] ?? o.status} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

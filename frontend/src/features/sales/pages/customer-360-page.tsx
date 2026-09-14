import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useCustomer360, useCustomer360Invoices, useCustomer360Payments, useCustomer360RentalBookings, useCustomer360RepairJobs, useCustomer360SalesOrders } from '@/features/sales/hooks/use-customer-360'
import { outstandingAmount } from '@/features/sales/types/sales-types'
import { OverviewTab } from '@/features/sales/components/customer-360/overview-tab'
import { CommercialTab } from '@/features/sales/components/customer-360/commercial-tab'
import { TransformersTab } from '@/features/sales/components/customer-360/transformers-tab'
import { SalesPipelineTab } from '@/features/sales/components/customer-360/sales-pipeline-tab'
import { RentalTab } from '@/features/sales/components/customer-360/rental-tab'
import { ServiceRepairTab } from '@/features/sales/components/customer-360/service-repair-tab'
import { TestingTab } from '@/features/sales/components/customer-360/testing-tab'
import { InvoicesPaymentsTab } from '@/features/sales/components/customer-360/invoices-payments-tab'
import { DocumentsTab } from '@/features/sales/components/customer-360/documents-tab'
import { TimelineTab } from '@/features/sales/components/customer-360/timeline-tab'
import { useAuth } from '@/providers/auth-provider'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'transformers', label: 'Transformers' },
  { value: 'pipeline', label: 'Sales Pipeline' },
  { value: 'rental', label: 'Rental' },
  { value: 'service', label: 'Service & Repair' },
  { value: 'testing', label: 'Testing' },
  { value: 'invoices', label: 'Invoices & Payments' },
  { value: 'documents', label: 'Documents' },
  { value: 'timeline', label: 'Timeline' },
] as const

export function Customer360Page() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('sales.manage')
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['value']>('overview')

  const { data: customer, isLoading: customerLoading } = useCustomer360(customerId)
  const { data: orders } = useCustomer360SalesOrders(customerId)
  const { data: invoices } = useCustomer360Invoices(customerId)
  const { data: payments } = useCustomer360Payments(customerId, true)
  const { data: rentalBookings } = useCustomer360RentalBookings(customerId)
  const { data: repairJobs } = useCustomer360RepairJobs(customerId)

  const outstanding = useMemo(() => (invoices ?? []).reduce((sum, inv) => sum + outstandingAmount(inv), 0), [invoices])

  if (customerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!customer) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Customer not found.</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link to="/sales/customers" />} nativeButton={false} className="w-fit">
          <ArrowLeft className="size-4" /> Back to Customers
        </Button>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{customer.name}</h1>
              {customer.is_active ? <StatusBadge status="active" label="Active" /> : <StatusBadge status="inactive" label="Inactive" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.customer_code} · {customer.customer_type} {customer.gstin && <>· GSTIN: {customer.gstin}</>}
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <p>Contact: {customer.contact_person || 'Not available'}</p>
              <p>Mobile: {customer.phone || 'Not available'}</p>
              <p>Email: {customer.email || 'Not available'}</p>
              <p>Address: {customer.billing_address || 'Not available'}</p>
              <p>Credit Limit: {customer.credit_limit ? `₹${customer.credit_limit.toLocaleString('en-IN')}` : 'Not available'}</p>
              <p className={outstanding > 0 ? 'font-medium text-chart-critical' : ''}>Outstanding: ₹{outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => navigate('/sales/customers')}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="h-auto flex-wrap justify-start">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab customerId={customerId!} orders={orders} invoices={invoices} payments={payments} rentalBookings={rentalBookings} repairJobs={repairJobs} />
        </TabsContent>
        <TabsContent value="commercial" className="mt-4">
          <CommercialTab customerId={customerId!} customer={customer} orders={orders} invoices={invoices} payments={payments} />
        </TabsContent>
        <TabsContent value="transformers" className="mt-4">
          <TransformersTab customerId={customerId!} active={activeTab === 'transformers'} />
        </TabsContent>
        <TabsContent value="pipeline" className="mt-4">
          <SalesPipelineTab customerId={customerId!} active={activeTab === 'pipeline'} />
        </TabsContent>
        <TabsContent value="rental" className="mt-4">
          <RentalTab customerId={customerId!} active={activeTab === 'rental'} rentalBookings={rentalBookings} />
        </TabsContent>
        <TabsContent value="service" className="mt-4">
          <ServiceRepairTab customerId={customerId!} active={activeTab === 'service'} repairJobs={repairJobs} />
        </TabsContent>
        <TabsContent value="testing" className="mt-4">
          <TestingTab customerId={customerId!} active={activeTab === 'testing'} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesPaymentsTab customerId={customerId!} invoices={invoices} payments={payments} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab customerId={customerId!} canManage={canManage} active={activeTab === 'documents'} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <TimelineTab customerId={customerId!} active={activeTab === 'timeline'} customerCreatedAt={customer.created_at} orders={orders} invoices={invoices} payments={payments} rentalBookings={rentalBookings} repairJobs={repairJobs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import {
  fetchCustomerById,
  fetchSalesOrdersForCustomer,
  fetchSalesInvoicesForCustomer,
  fetchSalesPaymentsForCustomer,
  fetchRentalBookingsForCustomer,
  fetchRepairJobsForCustomer,
  fetchOpportunitiesForCustomer,
  fetchSiteSurveysForCustomer,
  fetchQuotationsForCustomer,
  fetchTransformersForCustomer,
  fetchRentalInquiriesForCustomer,
  fetchRentalQuotationsForCustomer,
  fetchRentalAgreementsForCustomer,
  fetchRepairEstimatesForCustomer,
  fetchTestReportsForCustomer,
} from '@/features/sales/api/customer-360-api'

const KEY = 'customer-360'

export function useCustomer360(customerId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'customer', customerId],
    queryFn: () => fetchCustomerById(customerId!),
    enabled: Boolean(customerId),
  })
}

// Fetched eagerly (not gated by tab) -- the Overview tab's KPI cards need all four
// the moment the page loads, and they're each a small, customer-scoped result set.
export function useCustomer360SalesOrders(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'sales-orders', customerId], queryFn: () => fetchSalesOrdersForCustomer(customerId!), enabled: Boolean(customerId) })
}
export function useCustomer360Invoices(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'invoices', customerId], queryFn: () => fetchSalesInvoicesForCustomer(customerId!), enabled: Boolean(customerId) })
}
export function useCustomer360RentalBookings(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'rental-bookings', customerId], queryFn: () => fetchRentalBookingsForCustomer(customerId!), enabled: Boolean(customerId) })
}
export function useCustomer360RepairJobs(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'repair-jobs', customerId], queryFn: () => fetchRepairJobsForCustomer(customerId!), enabled: Boolean(customerId) })
}

// Fetched lazily -- only once the owning tab is actually opened.
export function useCustomer360Payments(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'payments', customerId], queryFn: () => fetchSalesPaymentsForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360Opportunities(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'opportunities', customerId], queryFn: () => fetchOpportunitiesForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360SiteSurveys(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'site-surveys', customerId], queryFn: () => fetchSiteSurveysForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360Quotations(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'quotations', customerId], queryFn: () => fetchQuotationsForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360Transformers(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'transformers', customerId], queryFn: () => fetchTransformersForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360RentalInquiries(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'rental-inquiries', customerId], queryFn: () => fetchRentalInquiriesForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360RentalQuotations(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'rental-quotations', customerId], queryFn: () => fetchRentalQuotationsForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360RentalAgreements(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'rental-agreements', customerId], queryFn: () => fetchRentalAgreementsForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360RepairEstimates(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'repair-estimates', customerId], queryFn: () => fetchRepairEstimatesForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}
export function useCustomer360TestReports(customerId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [KEY, 'test-reports', customerId], queryFn: () => fetchTestReportsForCustomer(customerId!), enabled: Boolean(customerId) && enabled })
}

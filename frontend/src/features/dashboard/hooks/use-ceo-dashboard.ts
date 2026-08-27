import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardBills,
  fetchDashboardCustomers,
  fetchDashboardEstimatesAwaitingApproval,
  fetchDashboardInvoices,
  fetchDashboardRentalAssetLookup,
  fetchDashboardRentalAssets,
  fetchDashboardRentalBookings,
  fetchDashboardRepairJobs,
  fetchDashboardStockAlerts,
} from '@/features/dashboard/api/ceo-dashboard-api'

const KEY = 'ceo-dashboard'

export function useDashboardInvoices() {
  return useQuery({ queryKey: [KEY, 'invoices'], queryFn: fetchDashboardInvoices })
}

export function useDashboardBills() {
  return useQuery({ queryKey: [KEY, 'bills'], queryFn: fetchDashboardBills })
}

export function useDashboardRepairJobs() {
  return useQuery({ queryKey: [KEY, 'repair-jobs'], queryFn: fetchDashboardRepairJobs })
}

export function useDashboardEstimatesAwaitingApproval() {
  return useQuery({ queryKey: [KEY, 'estimates-awaiting-approval'], queryFn: fetchDashboardEstimatesAwaitingApproval })
}

export function useDashboardRentalAssets() {
  return useQuery({ queryKey: [KEY, 'rental-assets'], queryFn: fetchDashboardRentalAssets })
}

export function useDashboardRentalAssetLookup() {
  return useQuery({ queryKey: [KEY, 'rental-asset-lookup'], queryFn: fetchDashboardRentalAssetLookup })
}

export function useDashboardRentalBookings() {
  return useQuery({ queryKey: [KEY, 'rental-bookings'], queryFn: fetchDashboardRentalBookings })
}

export function useDashboardStockAlerts() {
  return useQuery({ queryKey: [KEY, 'stock-alerts'], queryFn: fetchDashboardStockAlerts })
}

export function useDashboardCustomers() {
  return useQuery({ queryKey: [KEY, 'customers'], queryFn: fetchDashboardCustomers })
}

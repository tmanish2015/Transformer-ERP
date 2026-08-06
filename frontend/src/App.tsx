import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { LicenseProvider } from '@/providers/license-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout/layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { GuestRoute } from '@/components/auth/guest-route'
import { RequireCompany } from '@/components/auth/require-company'
import { RequirePermission } from '@/components/auth/require-permission'
import { queryClient } from '@/lib/query-client'

const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })))
const LoginPage = lazy(() => import('@/features/auth/pages/login-page').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/features/auth/pages/signup-page').then((m) => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/reset-password-page').then((m) => ({ default: m.ResetPasswordPage })))
const ProfilePage = lazy(() => import('@/features/auth/pages/profile-page').then((m) => ({ default: m.ProfilePage })))
const TeamMembersPage = lazy(() => import('@/features/auth/pages/team-members-page').then((m) => ({ default: m.TeamMembersPage })))
const UnauthorizedPage = lazy(() => import('@/features/auth/pages/unauthorized-page').then((m) => ({ default: m.UnauthorizedPage })))
const OnboardingPage = lazy(() => import('@/features/settings/pages/onboarding-page').then((m) => ({ default: m.OnboardingPage })))
const CompanyProfilePage = lazy(() => import('@/features/settings/pages/company-profile-page').then((m) => ({ default: m.CompanyProfilePage })))
const InventoryDashboardPage = lazy(() => import('@/features/inventory/pages/inventory-dashboard-page').then((m) => ({ default: m.InventoryDashboardPage })))
const ProductsPage = lazy(() => import('@/features/inventory/pages/products-page').then((m) => ({ default: m.ProductsPage })))
const CategoriesPage = lazy(() => import('@/features/inventory/pages/categories-page').then((m) => ({ default: m.CategoriesPage })))
const BrandsPage = lazy(() => import('@/features/inventory/pages/brands-page').then((m) => ({ default: m.BrandsPage })))
const UnitsPage = lazy(() => import('@/features/inventory/pages/units-page').then((m) => ({ default: m.UnitsPage })))
const WarehousesPage = lazy(() => import('@/features/inventory/pages/warehouses-page').then((m) => ({ default: m.WarehousesPage })))
const SuppliersPage = lazy(() => import('@/features/inventory/pages/suppliers-page').then((m) => ({ default: m.SuppliersPage })))
const StockLevelsPage = lazy(() => import('@/features/inventory/pages/stock-levels-page').then((m) => ({ default: m.StockLevelsPage })))
const BatchesPage = lazy(() => import('@/features/inventory/pages/batches-page').then((m) => ({ default: m.BatchesPage })))
const SerialNumbersPage = lazy(() => import('@/features/inventory/pages/serial-numbers-page').then((m) => ({ default: m.SerialNumbersPage })))
const MovementsPage = lazy(() => import('@/features/inventory/pages/movements-page').then((m) => ({ default: m.MovementsPage })))
const FinanceDashboardPage = lazy(() => import('@/features/finance/pages/finance-dashboard-page').then((m) => ({ default: m.FinanceDashboardPage })))
const ChartOfAccountsPage = lazy(() => import('@/features/finance/pages/chart-of-accounts-page').then((m) => ({ default: m.ChartOfAccountsPage })))
const JournalEntriesPage = lazy(() => import('@/features/finance/pages/journal-entries-page').then((m) => ({ default: m.JournalEntriesPage })))
const FinancialReportsPage = lazy(() => import('@/features/finance/pages/financial-reports-page').then((m) => ({ default: m.FinancialReportsPage })))
const PurchaseDashboardPage = lazy(() => import('@/features/purchases/pages/purchase-dashboard-page').then((m) => ({ default: m.PurchaseDashboardPage })))
const PurchaseOrdersPage = lazy(() => import('@/features/purchases/pages/purchase-orders-page').then((m) => ({ default: m.PurchaseOrdersPage })))
const GoodsReceiptsPage = lazy(() => import('@/features/purchases/pages/goods-receipts-page').then((m) => ({ default: m.GoodsReceiptsPage })))
const PurchaseBillsPage = lazy(() => import('@/features/purchases/pages/purchase-bills-page').then((m) => ({ default: m.PurchaseBillsPage })))
const SalesDashboardPage = lazy(() => import('@/features/sales/pages/sales-dashboard-page').then((m) => ({ default: m.SalesDashboardPage })))
const CustomersPage = lazy(() => import('@/features/sales/pages/customers-page').then((m) => ({ default: m.CustomersPage })))
const QuotationsPage = lazy(() => import('@/features/sales/pages/quotations-page').then((m) => ({ default: m.QuotationsPage })))
const SalesOrdersPage = lazy(() => import('@/features/sales/pages/sales-orders-page').then((m) => ({ default: m.SalesOrdersPage })))
const DeliveryChallansPage = lazy(() => import('@/features/sales/pages/delivery-challans-page').then((m) => ({ default: m.DeliveryChallansPage })))
const SalesInvoicesPage = lazy(() => import('@/features/sales/pages/sales-invoices-page').then((m) => ({ default: m.SalesInvoicesPage })))
const CustomerLedgerPage = lazy(() => import('@/features/sales/pages/customer-ledger-page').then((m) => ({ default: m.CustomerLedgerPage })))
const WorkshopDashboardPage = lazy(() => import('@/features/workshop/pages/workshop-dashboard-page').then((m) => ({ default: m.WorkshopDashboardPage })))
const RepairJobsPage = lazy(() => import('@/features/workshop/pages/repair-jobs-page').then((m) => ({ default: m.RepairJobsPage })))
const RepairJobDetailPage = lazy(() => import('@/features/workshop/pages/repair-job-detail-page').then((m) => ({ default: m.RepairJobDetailPage })))
const WorkshopReportsPage = lazy(() => import('@/features/workshop/pages/workshop-reports-page').then((m) => ({ default: m.WorkshopReportsPage })))
const TestReportsPage = lazy(() => import('@/features/testing-lab/pages/test-reports-page').then((m) => ({ default: m.TestReportsPage })))
const SiteSurveysPage = lazy(() => import('@/features/crm/pages/site-surveys-page').then((m) => ({ default: m.SiteSurveysPage })))
const OpportunitiesPage = lazy(() => import('@/features/crm/pages/opportunities-page').then((m) => ({ default: m.OpportunitiesPage })))
const TestReportDetailPage = lazy(() => import('@/features/testing-lab/pages/test-report-detail-page').then((m) => ({ default: m.TestReportDetailPage })))
const EmployeesPage = lazy(() => import('@/features/hr/pages/employees-page').then((m) => ({ default: m.EmployeesPage })))
const RentalDashboardPage = lazy(() => import('@/features/rental/pages/rental-dashboard-page').then((m) => ({ default: m.RentalDashboardPage })))
const RentalAssetCategoriesPage = lazy(() => import('@/features/rental/pages/rental-asset-categories-page').then((m) => ({ default: m.RentalAssetCategoriesPage })))
const RentalAssetsPage = lazy(() => import('@/features/rental/pages/rental-assets-page').then((m) => ({ default: m.RentalAssetsPage })))
const RentalAssetDetailPage = lazy(() => import('@/features/rental/pages/rental-asset-detail-page').then((m) => ({ default: m.RentalAssetDetailPage })))
const RentalInquiriesPage = lazy(() => import('@/features/rental/pages/rental-inquiries-page').then((m) => ({ default: m.RentalInquiriesPage })))
const RentalQuotationsPage = lazy(() => import('@/features/rental/pages/rental-quotations-page').then((m) => ({ default: m.RentalQuotationsPage })))
const RentalBookingsPage = lazy(() => import('@/features/rental/pages/rental-bookings-page').then((m) => ({ default: m.RentalBookingsPage })))
const RentalAgreementsPage = lazy(() => import('@/features/rental/pages/rental-agreements-page').then((m) => ({ default: m.RentalAgreementsPage })))
const RentalAgreementDetailPage = lazy(() => import('@/features/rental/pages/rental-agreement-detail-page').then((m) => ({ default: m.RentalAgreementDetailPage })))
const VehiclesPage = lazy(() => import('@/features/logistics/pages/vehicles-page').then((m) => ({ default: m.VehiclesPage })))
const DriversPage = lazy(() => import('@/features/logistics/pages/drivers-page').then((m) => ({ default: m.DriversPage })))
const TransformerPage = lazy(() => import('@/features/transformer/pages/transformer-page'))
const AiAssistantPage = lazy(() => import('@/features/ai/pages/ai-assistant-page').then((m) => ({ default: m.AiAssistantPage })))
const RentalAvailabilityPage = lazy(() => import('@/features/rental/pages/rental-availability-page').then((m) => ({ default: m.RentalAvailabilityPage })))
const RentalReportsPage = lazy(() => import('@/features/rental/pages/rental-reports-page').then((m) => ({ default: m.RentalReportsPage })))
const MaintenanceSchedulesPage = lazy(() => import('@/features/maintenance/pages/maintenance-schedules-page').then((m) => ({ default: m.MaintenanceSchedulesPage })))
const BomsPage = lazy(() => import('@/features/manufacturing/pages/boms-page').then((m) => ({ default: m.BomsPage })))
const ProductionOrdersPage = lazy(() => import('@/features/manufacturing/pages/production-orders-page').then((m) => ({ default: m.ProductionOrdersPage })))
const ProductionOrderDetailPage = lazy(() => import('@/features/manufacturing/pages/production-order-detail-page').then((m) => ({ default: m.ProductionOrderDetailPage })))
const ProductionReportsPage = lazy(() => import('@/features/manufacturing/pages/production-reports-page').then((m) => ({ default: m.ProductionReportsPage })))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

// The Electron build's BASE_URL is the relative "./" (needed for file:// loading) and has
// never been passed as a router basename — leave that path untouched. The web build's
// BASE_URL is the absolute deployed subpath, which does need to be the router basename so
// routes resolve under that subpath instead of the domain root.
const routerBasename = import.meta.env.BASE_URL !== './' ? import.meta.env.BASE_URL : undefined

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LicenseProvider>
            <TooltipProvider>
              <BrowserRouter basename={routerBasename}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<GuestRoute />}>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    </Route>

                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    <Route element={<ProtectedRoute />}>
                      <Route path="onboarding" element={<OnboardingPage />} />

                      <Route element={<RequireCompany />}>
                        <Route element={<Layout />}>
                          <Route index element={<DashboardPage />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route
                            path="team"
                            element={
                              <RequirePermission permission="users.view">
                                <TeamMembersPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="settings"
                            element={
                              <RequirePermission permission="settings.manage">
                                <CompanyProfilePage />
                              </RequirePermission>
                            }
                          />
                          <Route path="unauthorized" element={<UnauthorizedPage />} />

                          <Route
                            path="inventory"
                            element={
                              <RequirePermission permission="inventory.view">
                                <InventoryDashboardPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/products"
                            element={
                              <RequirePermission permission="inventory.view">
                                <ProductsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/categories"
                            element={
                              <RequirePermission permission="inventory.view">
                                <CategoriesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/brands"
                            element={
                              <RequirePermission permission="inventory.view">
                                <BrandsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/units"
                            element={
                              <RequirePermission permission="inventory.view">
                                <UnitsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/warehouses"
                            element={
                              <RequirePermission permission="inventory.view">
                                <WarehousesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/suppliers"
                            element={
                              <RequirePermission permission="inventory.view">
                                <SuppliersPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/stock-levels"
                            element={
                              <RequirePermission permission="inventory.view">
                                <StockLevelsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/batches"
                            element={
                              <RequirePermission permission="inventory.view">
                                <BatchesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/serial-numbers"
                            element={
                              <RequirePermission permission="inventory.view">
                                <SerialNumbersPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="inventory/movements"
                            element={
                              <RequirePermission permission="inventory.view">
                                <MovementsPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="finance"
                            element={
                              <RequirePermission permission="finance.view">
                                <FinanceDashboardPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="finance/accounts"
                            element={
                              <RequirePermission permission="finance.view">
                                <ChartOfAccountsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="finance/journal-entries"
                            element={
                              <RequirePermission permission="finance.view">
                                <JournalEntriesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="finance/reports"
                            element={
                              <RequirePermission permission="finance.view">
                                <FinancialReportsPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="purchases"
                            element={
                              <RequirePermission permission="purchases.view">
                                <PurchaseDashboardPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="purchases/orders"
                            element={
                              <RequirePermission permission="purchases.view">
                                <PurchaseOrdersPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="purchases/receipts"
                            element={
                              <RequirePermission permission="purchases.view">
                                <GoodsReceiptsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="purchases/bills"
                            element={
                              <RequirePermission permission="purchases.view">
                                <PurchaseBillsPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="sales"
                            element={
                              <RequirePermission permission="sales.view">
                                <SalesDashboardPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="sales/customers"
                            element={
                              <RequirePermission permission="sales.view">
                                <CustomersPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="sales/quotations"
                            element={
                              <RequirePermission permission="sales.view">
                                <QuotationsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="sales/orders"
                            element={
                              <RequirePermission permission="sales.view">
                                <SalesOrdersPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="sales/delivery-challans"
                            element={
                              <RequirePermission permission="sales.view">
                                <DeliveryChallansPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="sales/invoices"
                            element={
                              <RequirePermission permission="sales.view">
                                <SalesInvoicesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="sales/customer-ledger"
                            element={
                              <RequirePermission permission="sales.view">
                                <CustomerLedgerPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="workshop"
                            element={
                              <RequirePermission permission="workshop.view">
                                <WorkshopDashboardPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="workshop/jobs"
                            element={
                              <RequirePermission permission="workshop.view">
                                <RepairJobsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="workshop/jobs/:id"
                            element={
                              <RequirePermission permission="workshop.view">
                                <RepairJobDetailPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="workshop/reports"
                            element={
                              <RequirePermission permission="workshop.view">
                                <WorkshopReportsPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="crm/site-surveys"
                            element={
                              <RequirePermission permission="crm.view">
                                <SiteSurveysPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="crm/opportunities"
                            element={
                              <RequirePermission permission="crm.view">
                                <OpportunitiesPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="testing-lab/reports"
                            element={
                              <RequirePermission permission="testing-lab.view">
                                <TestReportsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="testing-lab/reports/:id"
                            element={
                              <RequirePermission permission="testing-lab.view">
                                <TestReportDetailPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="hr/employees"
                            element={
                              <RequirePermission permission="hr.view">
                                <EmployeesPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="rental"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalDashboardPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/categories"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalAssetCategoriesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/assets"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalAssetsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/assets/:id"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalAssetDetailPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/inquiries"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalInquiriesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/quotations"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalQuotationsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/bookings"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalBookingsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/agreements"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalAgreementsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/agreements/:id"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalAgreementDetailPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="rental/availability"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalAvailabilityPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="rental/reports"
                            element={
                              <RequirePermission permission="rental.view">
                                <RentalReportsPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="maintenance/schedules"
                            element={
                              <RequirePermission permission="maintenance.view">
                                <MaintenanceSchedulesPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="manufacturing/boms"
                            element={
                              <RequirePermission permission="manufacturing.view">
                                <BomsPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="manufacturing/orders"
                            element={
                              <RequirePermission permission="manufacturing.view">
                                <ProductionOrdersPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="manufacturing/orders/:id"
                            element={
                              <RequirePermission permission="manufacturing.view">
                                <ProductionOrderDetailPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="manufacturing/reports"
                            element={
                              <RequirePermission permission="manufacturing.view">
                                <ProductionReportsPage />
                              </RequirePermission>
                            }
                          />

                          <Route
                            path="logistics/vehicles"
                            element={
                              <RequirePermission permission="logistics.view">
                                <VehiclesPage />
                              </RequirePermission>
                            }
                          />
                          <Route
  path="transformers"
  element={
    <RequirePermission permission="inventory.view">
      <TransformerPage />
    </RequirePermission>
  }
/>
<Route
                            path="logistics/drivers"
                            element={
                              <RequirePermission permission="logistics.view">
                                <DriversPage />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="ai-assistant"
                            element={
                              <RequirePermission permission="ai.view">
                                <AiAssistantPage />
                              </RequirePermission>
                            }
                          />
                        </Route>
                      </Route>
                    </Route>
                  </Routes>
                </Suspense>
                <Toaster />
              </BrowserRouter>
            </TooltipProvider>
          </LicenseProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App

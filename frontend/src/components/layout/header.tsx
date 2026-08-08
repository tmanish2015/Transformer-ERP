import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/features/auth/components/user-menu'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/profile': 'Profile',
  '/team': 'Team Members',
  '/settings': 'Company Settings',
  '/unauthorized': 'Access Denied',
  '/inventory': 'Inventory Dashboard',
  '/inventory/products': 'Product Master',
  '/inventory/categories': 'Categories',
  '/inventory/brands': 'Brands',
  '/inventory/units': 'Units',
  '/inventory/warehouses': 'Warehouses',
  '/inventory/suppliers': 'Suppliers',
  '/inventory/stock-levels': 'Stock Levels',
  '/inventory/batches': 'Batch Management',
  '/inventory/serial-numbers': 'Serial Numbers',
  '/inventory/movements': 'Stock Movement History',
  '/finance': 'Financial Dashboard',
  '/finance/accounts': 'Chart of Accounts',
  '/finance/journal-entries': 'Journal Entries',
  '/finance/reports': 'Financial Reports',
  '/purchases': 'Purchase Dashboard',
  '/purchases/orders': 'Purchase Orders',
  '/purchases/receipts': 'Goods Receipt',
  '/purchases/bills': 'Purchase Bills',
  '/sales': 'Sales Dashboard',
  '/sales/customers': 'Customers',
  '/sales/quotations': 'Quotations',
  '/sales/orders': 'Sales Orders',
  '/sales/delivery-challans': 'Delivery Challans',
  '/sales/invoices': 'Sales Invoices',
  '/workshop': 'Workshop Dashboard',
  '/workshop/jobs': 'Repair Job Cards',
  '/workshop/reports': 'Workshop Reports',
  '/testing-lab/reports': 'Test Reports',
  '/crm/site-surveys': 'Site Surveys',
  '/crm/opportunities': 'Opportunities',
  '/hr/employees': 'Employees',
  '/rental': 'Rental Dashboard',
  '/rental/categories': 'Asset Categories',
  '/rental/assets': 'Rental Assets',
  '/rental/inquiries': 'Rental Inquiries',
  '/rental/quotations': 'Rental Quotations',
  '/rental/bookings': 'Rental Bookings',
  '/rental/agreements': 'Rental Agreements',
  '/rental/availability': 'Rental Availability',
  '/rental/reports': 'Rental Reports',
  '/logistics/vehicles': 'Vehicles',
  '/logistics/drivers': 'Drivers',
  '/maintenance/schedules': 'Maintenance Schedules',
  '/manufacturing/boms': 'Bills of Materials',
  '/manufacturing/orders': 'Production Orders',
  '/manufacturing/reports': 'Production Reports',
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'TransFab AI ERP'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu" onClick={onMenuClick}>
          <Menu className="size-4" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground sm:text-base">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}

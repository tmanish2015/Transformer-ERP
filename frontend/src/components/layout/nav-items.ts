import { Boxes, CalendarClock, Factory, FlaskConical, LayoutDashboard, Landmark, Settings, ShoppingBag, Sparkles, Target, Truck, TrendingUp, UserCog, Users, UserRound, Wrench, type LucideIcon } from 'lucide-react'

export interface NavLink {
  type: 'link'
  label: string
  to: string
  icon: LucideIcon
  permission?: string
  /** Licensing gate: hidden unless the customer's plan includes this module code. */
  module?: string
  /** Licensing gate: hidden unless the customer's plan includes this feature code. */
  feature?: string
}

export interface NavGroup {
  type: 'group'
  label: string
  icon: LucideIcon
  permission?: string
  module?: string
  feature?: string
  items: { label: string; to: string }[]
}

export type NavEntry = NavLink | NavGroup

export interface NavSection {
  label: string
  entries: NavEntry[]
}

// Extended module by module as each vertical ships — see docs-architecture/05-development-roadmap.md.
// Sections group modules by department so the sidebar reads as an org chart, not a flat
// module list — a section disappears entirely once none of its entries are licensed/permitted.
export const navSections: NavSection[] = [
  {
    label: 'Main',
    entries: [{ type: 'link', label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Sales & CRM',
    entries: [
      {
        type: 'group',
        label: 'Sales',
        icon: TrendingUp,
        permission: 'sales.view',
        items: [
          { label: 'Dashboard', to: '/sales' },
          { label: 'Customers', to: '/sales/customers' },
          { label: 'Quotations', to: '/sales/quotations' },
          { label: 'Sales Orders', to: '/sales/orders' },
          { label: 'Delivery Challans', to: '/sales/delivery-challans' },
          { label: 'Invoices', to: '/sales/invoices' },
        ],
      },
      {
        type: 'group',
        label: 'CRM',
        icon: Target,
        permission: 'crm.view',
        items: [
          { label: 'Site Surveys', to: '/crm/site-surveys' },
          { label: 'Opportunities', to: '/crm/opportunities' },
        ],
      },
    ],
  },
  {
    label: 'Operations',
    entries: [
      {
        type: 'group',
        label: 'Workshop',
        icon: Wrench,
        permission: 'workshop.view',
        items: [
          { label: 'Dashboard', to: '/workshop' },
          { label: 'Job Cards', to: '/workshop/jobs' },
          { label: 'Reports', to: '/workshop/reports' },
        ],
      },
      {
        type: 'group',
        label: 'Rental',
        icon: Truck,
        permission: 'rental.view',
        items: [
          { label: 'Dashboard', to: '/rental' },
          { label: 'Assets', to: '/rental/assets' },
          { label: 'Categories', to: '/rental/categories' },
          { label: 'Inquiries', to: '/rental/inquiries' },
          { label: 'Quotations', to: '/rental/quotations' },
          { label: 'Bookings', to: '/rental/bookings' },
          { label: 'Agreements', to: '/rental/agreements' },
          { label: 'Availability', to: '/rental/availability' },
          { label: 'Reports', to: '/rental/reports' },
        ],
      },
      {
        type: 'group',
        label: 'Manufacturing',
        icon: Factory,
        permission: 'manufacturing.view',
        items: [
          { label: 'BOMs', to: '/manufacturing/boms' },
          { label: 'Production Orders', to: '/manufacturing/orders' },
          { label: 'Reports', to: '/manufacturing/reports' },
        ],
      },
{ type: 'link', label: 'Testing Lab', to: '/testing-lab/reports', icon: FlaskConical, permission: 'testing-lab.view' },
      { type: 'link', label: 'Maintenance', to: '/maintenance/schedules', icon: CalendarClock, permission: 'maintenance.view' },
      { type: 'link', label: 'AI Assistant', to: '/ai-assistant', icon: Sparkles, permission: 'ai.view' },
    ],
  },
  {
    label: 'Supply Chain',
    entries: [
      {
        type: 'group',
        label: 'Inventory',
        icon: Boxes,
        permission: 'inventory.view',
        items: [
          { label: 'Dashboard', to: '/inventory' },
          { label: 'Products', to: '/inventory/products' },
          { label: 'Transformer Master', to: '/transformers' },
          { label: 'Categories', to: '/inventory/categories' },
          { label: 'Brands', to: '/inventory/brands' },
          { label: 'Units', to: '/inventory/units' },
          { label: 'Warehouses', to: '/inventory/warehouses' },
          { label: 'Suppliers', to: '/inventory/suppliers' },
          { label: 'Stock Levels', to: '/inventory/stock-levels' },
          { label: 'Batch Management', to: '/inventory/batches' },
          { label: 'Serial Numbers', to: '/inventory/serial-numbers' },
          { label: 'Movement History', to: '/inventory/movements' },
        ],
      },
      {
        type: 'group',
        label: 'Purchases',
        icon: ShoppingBag,
        permission: 'purchases.view',
        items: [
          { label: 'Dashboard', to: '/purchases' },
          { label: 'Purchase Orders', to: '/purchases/orders' },
          { label: 'Goods Receipt', to: '/purchases/receipts' },
          { label: 'Bills', to: '/purchases/bills' },
        ],
      },
      {
        type: 'group',
        label: 'Logistics',
        icon: UserRound,
        permission: 'logistics.view',
        items: [
          { label: 'Vehicles', to: '/logistics/vehicles' },
          { label: 'Drivers', to: '/logistics/drivers' },
        ],
      },
    ],
  },
  {
    label: 'Finance',
    entries: [
      {
        type: 'group',
        label: 'Finance',
        icon: Landmark,
        permission: 'finance.view',
        items: [
          { label: 'Dashboard', to: '/finance' },
          { label: 'Chart of Accounts', to: '/finance/accounts' },
          { label: 'Journal Entries', to: '/finance/journal-entries' },
          { label: 'Financial Reports', to: '/finance/reports' },
        ],
      },
    ],
  },
  {
    label: 'Admin',
    entries: [
      { type: 'link', label: 'Employees', to: '/hr/employees', icon: Users, permission: 'hr.view' },
      { type: 'link', label: 'Team', to: '/team', icon: UserCog, permission: 'users.view' },
      { type: 'link', label: 'Settings', to: '/settings', icon: Settings, permission: 'settings.manage' },
    ],
  },
]

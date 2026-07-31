import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems, type NavEntry } from '@/components/layout/nav-items'
import { useAuth } from '@/providers/auth-provider'
import { useLicense } from '@/providers/license-provider'

interface NavLinksProps {
  onNavigate?: () => void
}

const linkClasses =
  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
const activeLinkClasses = 'bg-sidebar-accent text-sidebar-accent-foreground'

function NavGroupItem({ entry, onNavigate }: { entry: Extract<NavEntry, { type: 'group' }>; onNavigate?: () => void }) {
  const location = useLocation()
  const isRootItem = (to: string) => !entry.items.some((other) => other.to.startsWith(`${to}/`))
  const containsActive = entry.items.some((item) => (isRootItem(item.to) ? location.pathname === item.to : location.pathname.startsWith(item.to)))
  const [open, setOpen] = useState(containsActive)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(linkClasses, 'w-full justify-between', containsActive && !open && activeLinkClasses)}
      >
        <span className="flex items-center gap-3">
          <entry.icon className="size-4" />
          {entry.label}
        </span>
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-3">
          {entry.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={isRootItem(item.to)}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn('block rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', isActive && activeLinkClasses)
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  const { hasPermission } = useAuth()
  const { hasModule, hasFeature } = useLicense()
  const visibleItems = navItems.filter(
    (item) => (!item.permission || hasPermission(item.permission)) && (!item.module || hasModule(item.module)) && (!item.feature || hasFeature(item.feature)),
  )

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {visibleItems.map((entry) => {
        if (entry.type === 'group') {
          return <NavGroupItem key={entry.label} entry={entry} onNavigate={onNavigate} />
        }
        return (
          <NavLink key={entry.to} to={entry.to} end={entry.to === '/'} onClick={onNavigate} className={({ isActive }) => cn(linkClasses, isActive && activeLinkClasses)}>
            <entry.icon className="size-4" />
            {entry.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

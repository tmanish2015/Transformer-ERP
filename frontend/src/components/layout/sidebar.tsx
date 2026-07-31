import { TransFlowMark } from '@/components/brand/transflow-mark'
import { NavLinks } from '@/components/layout/nav-links'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TransFlowMark className="size-4" />
        </div>
        <span className="font-semibold text-sidebar-foreground">TransFlow AI ERP</span>
      </div>

      <NavLinks />

      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">TransFlow AI ERP v0.1.0</div>
    </aside>
  )
}

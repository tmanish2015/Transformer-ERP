import { TransFlowMark } from '@/components/brand/transflow-mark'
import { NavLinks } from '@/components/layout/nav-links'
import { useCompanyProfile } from '@/features/settings/hooks/use-company-profile'

export function Sidebar() {
  const { data: company } = useCompanyProfile()
  const companyName = company?.name || 'TransFlow AI ERP'

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex min-h-14 items-start gap-2 border-b border-sidebar-border px-5 py-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          {company?.logo_url ? <img src={company.logo_url} alt="" className="size-full rounded-md object-cover" /> : <TransFlowMark className="size-4" />}
        </div>
        <span className="min-w-0 break-words text-sm leading-tight font-semibold text-sidebar-foreground">{companyName}</span>
      </div>

      <NavLinks />

      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">{companyName} v0.1.0</div>
    </aside>
  )
}

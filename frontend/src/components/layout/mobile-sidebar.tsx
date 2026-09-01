import { TransFlowMark } from '@/components/brand/transflow-mark'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { NavLinks } from '@/components/layout/nav-links'
import { useCompanyProfile } from '@/features/settings/hooks/use-company-profile'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { data: company } = useCompanyProfile()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <SheetHeader className="h-14 flex-row items-center gap-2 space-y-0 border-b border-sidebar-border px-5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {company?.logo_url ? <img src={company.logo_url} alt="" className="size-full rounded-md object-cover" /> : <TransFlowMark className="size-4" />}
          </div>
          <SheetTitle className="truncate text-sm font-semibold text-sidebar-foreground">{company?.name || 'TransFlow AI ERP'}</SheetTitle>
        </SheetHeader>

        <NavLinks onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

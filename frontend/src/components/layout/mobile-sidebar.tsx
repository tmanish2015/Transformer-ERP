import { TransFlowMark } from '@/components/brand/transflow-mark'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { NavLinks } from '@/components/layout/nav-links'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <SheetHeader className="h-14 flex-row items-center gap-2 space-y-0 border-b border-sidebar-border px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TransFlowMark className="size-4" />
          </div>
          <SheetTitle className="text-sm font-semibold text-sidebar-foreground">TransFlow AI ERP</SheetTitle>
        </SheetHeader>

        <NavLinks onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

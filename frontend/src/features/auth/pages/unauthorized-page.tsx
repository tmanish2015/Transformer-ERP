import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Access denied</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          You don&apos;t have permission to view this page. Contact your administrator if you think this is a mistake.
        </p>
      </div>
      <Button render={<Link to="/" />} nativeButton={false}>
        Back to dashboard
      </Button>
    </div>
  )
}

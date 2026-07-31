import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/providers/auth-provider'
import { useLicense } from '@/providers/license-provider'

export function DashboardPage() {
  const { profile } = useAuth()
  const { entitlements } = useLicense()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          Welcome{profile?.fullName ? `, ${profile.fullName}` : ''}
        </h2>
        <p className="text-sm text-muted-foreground">
          {entitlements?.plan?.name ? `${entitlements.plan.name} plan` : 'Setting up your workspace'}
          {entitlements?.trial_ends_at && ` — trial ends ${new Date(entitlements.trial_ends_at).toLocaleDateString()}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foundation ready</CardTitle>
          <CardDescription>
            Module dashboards (Workshop, Rental, Finance, Inventory, HR, Engineer) light up here as each module ships.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Licensed modules: {entitlements?.modules?.length ? entitlements.modules.join(', ') : 'none yet'}
        </CardContent>
      </Card>
    </div>
  )
}

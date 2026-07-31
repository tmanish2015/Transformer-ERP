import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'

/**
 * Gates every route except /onboarding itself. A freshly self-registered user has a
 * session and a profile row but no company_id yet (see handle_new_user() /
 * create_company_and_admin() in database/migrations) — send them to the onboarding
 * wizard until that's resolved, same shape as ProtectedRoute's session gate.
 */
export function RequireCompany() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (profile && !profile.companyId) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, MonitorSmartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RoleBadge } from '@/features/auth/components/role-badge'
import { ProfileForm } from '@/features/auth/components/profile-form'
import { ChangePasswordForm } from '@/features/auth/components/change-password-form'
import { useAuth } from '@/providers/auth-provider'

function getInitials(name: string | null, email: string | undefined) {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }
  return email?.[0]?.toUpperCase() ?? '?'
}

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState<'local' | 'global' | null>(null)

  const handleSignOut = async (allDevices: boolean) => {
    setSigningOut(allDevices ? 'global' : 'local')
    await signOut({ allDevices })
    navigate('/login', { replace: true })
  }

  const lastSignInAt = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">{getInitials(profile?.fullName ?? null, user?.email)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{profile?.fullName || user?.email}</h2>
          <div className="flex items-center gap-2">{profile && <RoleBadge roleKey={profile.role.key} roleName={profile.role.name} />}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Manage your active session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <MonitorSmartphone className="size-4" />
            Last signed in {lastSignInAt}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => handleSignOut(false)} disabled={signingOut !== null}>
              <LogOut className="size-4" />
              Sign out
            </Button>
            <Button variant="destructive" onClick={() => handleSignOut(true)} disabled={signingOut !== null}>
              <LogOut className="size-4" />
              Sign out of all devices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

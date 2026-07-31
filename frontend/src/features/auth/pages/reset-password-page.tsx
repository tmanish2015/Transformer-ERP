import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'
import { useAuth } from '@/providers/auth-provider'

export function ResetPasswordPage() {
  const { session, isLoading } = useAuth()

  return (
    <AuthLayout title="Set a new password" description="Choose a strong password for your account.">
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : session ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password" className="inline-block text-sm font-medium text-primary hover:underline">
            Request a new link
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}

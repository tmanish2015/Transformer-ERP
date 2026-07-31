import { AuthLayout } from '@/features/auth/components/auth-layout'
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form'

export function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot your password?" description="Enter your email and we'll send you a link to reset it.">
      <ForgotPasswordForm />
    </AuthLayout>
  )
}

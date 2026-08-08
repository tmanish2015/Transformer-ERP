import { Link } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { LoginForm } from '@/features/auth/components/login-form'

export function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your TransFlow AI ERP workspace."
      footer={
        <>
          New to your team's workspace?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}

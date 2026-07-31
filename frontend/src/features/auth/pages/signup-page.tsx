import { Link } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { SignupForm } from '@/features/auth/components/signup-form'

export function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Set up your company's Transformer AI ERP workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthLayout>
  )
}

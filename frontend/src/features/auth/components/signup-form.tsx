import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/form/password-input'
import { signupSchema, type SignupFormValues } from '@/features/auth/schemas/auth-schemas'
import { useSignup } from '@/features/auth/hooks/use-signup'

export function SignupForm() {
  const navigate = useNavigate()
  const signup = useSignup()
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = (values: SignupFormValues) => {
    signup.mutate(values, {
      onSuccess: (data) => {
        // A session means email confirmation is off on this project — the account is
        // ready immediately. RequireCompany then routes them to /onboarding since their
        // profile has no company_id yet.
        if (data.session) {
          navigate('/', { replace: true })
        } else {
          setAwaitingConfirmation(true)
        }
      },
    })
  }

  if (awaitingConfirmation) {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertDescription>
          Account created. Check your email to confirm it, then sign in to set up your company.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {signup.isError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {signup.error instanceof Error ? signup.error.message : 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Your name"
          aria-invalid={Boolean(errors.fullName)}
          {...register('fullName')}
        />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={signup.isPending}>
        {signup.isPending && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>
    </form>
  )
}

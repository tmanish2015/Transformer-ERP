import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas/auth-schemas'
import { useForgotPassword } from '@/features/auth/hooks/use-forgot-password'

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  if (forgotPassword.isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to <span className="font-medium">{getValues('email')}</span>.
          </p>
        </div>
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit((values) => forgotPassword.mutate(values))} className="space-y-5" noValidate>
      {forgotPassword.isError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {forgotPassword.error instanceof Error ? forgotPassword.error.message : 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

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

      <Button type="submit" className="w-full" size="lg" disabled={forgotPassword.isPending}>
        {forgotPassword.isPending && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>

      <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </form>
  )
}

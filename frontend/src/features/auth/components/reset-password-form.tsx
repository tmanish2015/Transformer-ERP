import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/form/password-input'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/schemas/auth-schemas'
import { useResetPassword } from '@/features/auth/hooks/use-reset-password'

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPassword.mutate(values, {
      onSuccess: () => navigate('/', { replace: true }),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {resetPassword.isError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {resetPassword.error instanceof Error ? resetPassword.error.message : 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={resetPassword.isPending}>
        {resetPassword.isPending && <Loader2 className="size-4 animate-spin" />}
        Reset password
      </Button>
    </form>
  )
}

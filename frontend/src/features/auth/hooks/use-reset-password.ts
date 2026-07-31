import { useMutation } from '@tanstack/react-query'
import { updatePassword } from '@/features/auth/api/auth-api'
import type { ResetPasswordFormValues } from '@/features/auth/schemas/auth-schemas'

export function useResetPassword() {
  return useMutation({
    mutationFn: (values: ResetPasswordFormValues) => updatePassword(values.password),
  })
}

import { useMutation } from '@tanstack/react-query'
import { requestPasswordReset } from '@/features/auth/api/auth-api'
import type { ForgotPasswordFormValues } from '@/features/auth/schemas/auth-schemas'

export function useForgotPassword() {
  return useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => requestPasswordReset(values.email),
  })
}

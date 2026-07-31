import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { changePassword } from '@/features/auth/api/auth-api'
import type { ChangePasswordFormValues } from '@/features/auth/schemas/auth-schemas'

export function useChangePassword() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: (values: ChangePasswordFormValues) => changePassword(user!.email!, values.currentPassword, values.newPassword),
  })
}

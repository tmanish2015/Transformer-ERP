import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { updateProfile } from '@/features/auth/api/auth-api'
import type { ProfileFormValues } from '@/features/auth/schemas/auth-schemas'

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateProfile(user!.id, {
        full_name: values.fullName,
        phone: values.phone || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile', user?.id] })
    },
  })
}

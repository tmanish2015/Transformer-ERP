import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserRole } from '@/features/auth/api/auth-api'

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => updateUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'team-members'] })
    },
  })
}

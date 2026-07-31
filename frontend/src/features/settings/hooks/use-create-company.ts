import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCompanyAndAdmin } from '@/features/settings/api/company-api'

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCompanyAndAdmin,
    onSuccess: () => {
      // profile.company_id changed server-side; refetch the auth profile + entitlements
      // rather than invalidating by exact key, since profile query key includes userId.
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['licensing', 'entitlements'] })
    },
  })
}

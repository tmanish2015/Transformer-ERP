import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchCompany, updateCompany } from '@/features/settings/api/settings-api'
import { useAuth } from '@/providers/auth-provider'

const COMPANY_KEY = 'company-profile'

export function useCompanyProfile() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [COMPANY_KEY, profile?.companyId],
    queryFn: () => fetchCompany(profile!.companyId!),
    enabled: Boolean(profile?.companyId),
  })
}

export function useUpdateCompanyProfile() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: { name: string; industry_type: string }) => updateCompany(profile!.companyId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY] })
      toast.success('Company profile saved')
    },
    onError: (error) => toast.error(error.message),
  })
}

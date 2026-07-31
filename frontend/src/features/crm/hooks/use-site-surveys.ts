import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cancelSiteSurvey, completeSiteSurvey, createSiteSurvey, deleteSiteSurvey, fetchSiteSurvey, fetchSiteSurveys } from '@/features/crm/api/crm-api'
import type { SiteSurveyCompletionFormValues, SiteSurveyFormValues } from '@/features/crm/schemas/crm-schemas'

const KEY = 'site-surveys'

export function useSiteSurveys() {
  return useQuery({ queryKey: [KEY], queryFn: fetchSiteSurveys })
}

export function useSiteSurvey(id: string | undefined) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => fetchSiteSurvey(id!), enabled: Boolean(id) })
}

export function useCreateSiteSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SiteSurveyFormValues) => createSiteSurvey(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Site survey scheduled')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCompleteSiteSurvey(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SiteSurveyCompletionFormValues) => completeSiteSurvey(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Site survey completed')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCancelSiteSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelSiteSurvey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Site survey cancelled')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteSiteSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSiteSurvey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Site survey deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}

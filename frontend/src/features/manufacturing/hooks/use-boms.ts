import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createBom, fetchBomLines, fetchBoms } from '@/features/manufacturing/api/manufacturing-api'
import type { BomFormValues } from '@/features/manufacturing/schemas/manufacturing-schemas'

const KEY = 'boms'

export function useBoms() {
  return useQuery({ queryKey: [KEY], queryFn: fetchBoms })
}

export function useBomLines(bomId: string | undefined) {
  return useQuery({
    queryKey: [KEY, bomId, 'lines'],
    queryFn: () => fetchBomLines(bomId!),
    enabled: Boolean(bomId),
  })
}

export function useCreateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: BomFormValues) => createBom(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('BOM created')
    },
    onError: (error) => toast.error(error.message),
  })
}

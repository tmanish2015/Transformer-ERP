import { useQuery } from '@tanstack/react-query'
import { fetchTestTypes } from '@/features/testing-lab/api/testing-lab-api'

export function useTestTypes() {
  return useQuery({ queryKey: ['test-types'], queryFn: fetchTestTypes })
}

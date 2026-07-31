import { useQuery } from '@tanstack/react-query'
import { fetchTrip } from '@/features/logistics/api/logistics-api'

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => fetchTrip(id!),
    enabled: Boolean(id),
  })
}

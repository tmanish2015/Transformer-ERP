import { useQuery } from '@tanstack/react-query'
import { fetchProductionConsumptionMovements } from '@/features/manufacturing/api/manufacturing-api'

export function useProductionConsumptionMovements() {
  return useQuery({ queryKey: ['production-consumption-movements'], queryFn: fetchProductionConsumptionMovements })
}

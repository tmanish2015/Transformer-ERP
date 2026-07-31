import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createGoodsReceipt, fetchGoodsReceipts, fetchReceivablePOs } from '@/features/purchases/api/purchases-api'

export function useGoodsReceipts() {
  return useQuery({ queryKey: ['goods-receipts'], queryFn: fetchGoodsReceipts })
}

export function useReceivablePOs() {
  return useQuery({ queryKey: ['purchase-orders', 'receivable'], queryFn: fetchReceivablePOs })
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGoodsReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-levels'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      toast.success('Goods receipt recorded — stock updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

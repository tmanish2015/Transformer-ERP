import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { transformerApi } from '@/features/transformer/api/transformer-api'
import type { TransformerFormValues } from '@/features/transformer/schemas/transformer-schema'

const KEY = 'transformers'

export function useTransformers() {
  return useQuery({
    queryKey: [KEY],
    queryFn: transformerApi.list,
  })
}

export function useCreateTransformer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TransformerFormValues) => transformerApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Transformer created')
    },
    onError: (error: any) => toast.error(error.message),
  })
}

export function useUpdateTransformer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransformerFormValues }) => transformerApi.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Transformer updated')
    },
    onError: (error: any) => toast.error(error.message),
  })
}

export function useDeleteTransformer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: transformerApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Transformer deleted')
    },
    onError: (error: any) => toast.error(error.message),
  })
}

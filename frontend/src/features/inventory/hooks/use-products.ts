import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createProduct, deleteAllProducts, deleteProduct, fetchProducts, updateProduct } from '@/features/inventory/api/products-api'
import type { ProductFormValues } from '@/features/inventory/schemas/inventory-schemas'

const PRODUCTS_KEY = 'inventory-products'

export function useProducts() {
  return useQuery({ queryKey: [PRODUCTS_KEY], queryFn: fetchProducts })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Product created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ProductFormValues> }) => updateProduct(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Product updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Product deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteAllProducts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAllProducts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

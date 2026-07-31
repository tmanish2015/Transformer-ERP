import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { closeRentalInquiry, createRentalInquiry, fetchRentalInquiries } from '@/features/rental/api/rental-api'
import type { RentalInquiryFormValues } from '@/features/rental/schemas/rental-schemas'

const KEY = 'rental-inquiries'

export function useRentalInquiries() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRentalInquiries })
}

export function useCreateRentalInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalInquiryFormValues) => createRentalInquiry(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Inquiry captured')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCloseRentalInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => closeRentalInquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Inquiry closed')
    },
    onError: (error) => toast.error(error.message),
  })
}

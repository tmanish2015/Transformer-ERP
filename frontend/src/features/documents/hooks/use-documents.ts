import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteDocument, fetchDocuments, uploadDocument } from '@/features/documents/api/documents-api'
import type { DocumentCategory, DocumentReferenceType } from '@/features/documents/types/documents-types'

const KEY = 'documents'

export function useDocuments(referenceType: DocumentReferenceType, referenceId: string | undefined) {
  return useQuery({
    queryKey: [KEY, referenceType, referenceId],
    queryFn: () => fetchDocuments(referenceType, referenceId!),
    enabled: Boolean(referenceId),
  })
}

export function useUploadDocument(referenceType: DocumentReferenceType, referenceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { companyId: string; category: DocumentCategory; file: File }) => uploadDocument({ referenceType, referenceId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, referenceType, referenceId] })
      toast.success('Document uploaded')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteDocument(referenceType: DocumentReferenceType, referenceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) => deleteDocument(id, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, referenceType, referenceId] })
      toast.success('Document deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}

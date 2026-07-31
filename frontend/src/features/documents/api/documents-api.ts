import { supabase } from '@/lib/supabase'
import type { DocumentCategory, DocumentReferenceType, DocumentRow } from '@/features/documents/types/documents-types'

export async function fetchDocuments(referenceType: DocumentReferenceType, referenceId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('reference_type', referenceType)
    .eq('reference_id', referenceId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

interface UploadDocumentParams {
  companyId: string
  referenceType: DocumentReferenceType
  referenceId: string
  category: DocumentCategory
  file: File
}

export async function uploadDocument({ companyId, referenceType, referenceId, category, file }: UploadDocumentParams) {
  const storagePath = `${companyId}/${referenceType}/${referenceId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('documents')
    .insert({ reference_type: referenceType, reference_id: referenceId, category, file_name: file.name, storage_path: storagePath })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDocumentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 60)
  if (error) throw error
  return data.signedUrl
}

export async function deleteDocument(id: string, storagePath: string) {
  const { error: storageError } = await supabase.storage.from('documents').remove([storagePath])
  if (storageError) throw storageError
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}

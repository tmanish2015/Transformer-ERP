import { useRef, useState, type ChangeEvent } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuth } from '@/providers/auth-provider'
import { useDeleteDocument, useDocuments, useUploadDocument } from '@/features/documents/hooks/use-documents'
import { getDocumentSignedUrl } from '@/features/documents/api/documents-api'
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory, type DocumentReferenceType } from '@/features/documents/types/documents-types'

interface DocumentsPanelProps {
  referenceType: DocumentReferenceType
  referenceId: string
  canManage: boolean
}

export function DocumentsPanel({ referenceType, referenceId, canManage }: DocumentsPanelProps) {
  const { profile } = useAuth()
  const { data: documents, isLoading } = useDocuments(referenceType, referenceId)
  const uploadDoc = useUploadDocument(referenceType, referenceId)
  const deleteDoc = useDeleteDocument(referenceType, referenceId)
  const [category, setCategory] = useState<DocumentCategory>('photo')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !profile?.companyId) return
    uploadDoc.mutate({ companyId: profile.companyId, category, file })
  }

  const handleDownload = async (storagePath: string) => {
    const url = await getDocumentSignedUrl(storagePath)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {canManage && (
          <div className="flex items-center gap-2">
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" disabled={uploadDoc.isPending} onClick={() => fileInputRef.current?.click()}>
              {uploadDoc.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !documents || documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents yet" />
        ) : (
          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 py-2">
                <button type="button" className="flex min-w-0 items-center gap-2 text-left text-sm text-primary hover:underline" onClick={() => handleDownload(doc.storage_path)}>
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">{doc.file_name}</span>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory]}</span>
                  {canManage && (
                    <Button type="button" variant="ghost" size="icon-sm" disabled={deleteDoc.isPending} onClick={() => deleteDoc.mutate({ id: doc.id, storagePath: doc.storage_path })}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import type { Tables } from '@/types/database.types'

export type DocumentRow = Tables<'documents'>

export type DocumentReferenceType = 'repair_job' | 'rental_agreement' | 'production_order' | 'test_report' | 'customer' | 'employee'

export type DocumentCategory = 'certificate' | 'invoice' | 'drawing' | 'photo' | 'warranty_card' | 'manual' | 'report'

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  certificate: 'Certificate',
  invoice: 'Invoice',
  drawing: 'Drawing',
  photo: 'Photo',
  warranty_card: 'Warranty Card',
  manual: 'Manual',
  report: 'Report',
}

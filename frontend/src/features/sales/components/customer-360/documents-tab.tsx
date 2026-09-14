import { DocumentsPanel } from '@/features/documents/components/documents-panel'

interface DocumentsTabProps {
  customerId: string
  canManage: boolean
  active: boolean
}

export function DocumentsTab({ customerId, canManage, active }: DocumentsTabProps) {
  if (!active) return null
  return <DocumentsPanel referenceType="customer" referenceId={customerId} canManage={canManage} />
}

import type { Tables } from '@/types/database.types'

export type Transformer = Tables<'transformers'>

export type TransformerStatus = 'IN SERVICE' | 'IN REPAIR' | 'OUT OF SERVICE' | 'DECOMMISSIONED'

export const TRANSFORMER_STATUS_LABELS: Record<TransformerStatus, string> = {
  'IN SERVICE': 'In Service',
  'IN REPAIR': 'In Repair',
  'OUT OF SERVICE': 'Out of Service',
  DECOMMISSIONED: 'Decommissioned',
}

export interface NamedRef {
  id: string
  name: string
}

export interface TransformerWithCustomer extends Transformer {
  customer: NamedRef | null
}

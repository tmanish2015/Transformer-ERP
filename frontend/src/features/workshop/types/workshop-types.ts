import type { Tables } from '@/types/database.types'

export type RepairJob = Tables<'repair_jobs'>
export type RepairEstimate = Tables<'repair_estimates'>
export type RepairEstimateItem = Tables<'repair_estimate_items'>
export type RepairJobStageHistory = Tables<'repair_job_stage_history'>
export type RepairWarranty = Tables<'repair_warranties'>

export type RepairJobStatus = 'received' | 'inspection' | 'estimate_pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
export type RepairEstimateStatus = 'draft' | 'sent' | 'customer_approved' | 'customer_rejected'
export type EstimateItemType = 'spare_part' | 'labor' | 'other'

export const REPAIR_JOB_STATUS_LABELS: Record<RepairJobStatus, string> = {
  received: 'Received',
  inspection: 'Under Inspection',
  estimate_pending: 'Estimate Pending',
  approved: 'Approved — In Queue',
  rejected: 'Customer Rejected',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const REPAIR_ESTIMATE_STATUS_LABELS: Record<RepairEstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent to Customer',
  customer_approved: 'Customer Approved',
  customer_rejected: 'Customer Rejected',
}

export const ESTIMATE_ITEM_TYPE_LABELS: Record<EstimateItemType, string> = {
  spare_part: 'Spare Part',
  labor: 'Labor',
  other: 'Other',
}

export type RepairStage =
  | 'dismantling'
  | 'core_inspection'
  | 'coil_inspection'
  | 'rewinding'
  | 'core_assembly'
  | 'tank_repair'
  | 'painting'
  | 'oil_filling'
  | 'testing'
  | 'qc'
  | 'dispatch'
  | 'installation'

export const REPAIR_STAGE_ORDER: RepairStage[] = [
  'dismantling',
  'core_inspection',
  'coil_inspection',
  'rewinding',
  'core_assembly',
  'tank_repair',
  'painting',
  'oil_filling',
  'testing',
  'qc',
  'dispatch',
  'installation',
]

export const REPAIR_STAGE_LABELS: Record<RepairStage, string> = {
  dismantling: 'Dismantling',
  core_inspection: 'Core Inspection',
  coil_inspection: 'Coil Inspection',
  rewinding: 'Rewinding',
  core_assembly: 'Core Assembly',
  tank_repair: 'Tank Repair',
  painting: 'Painting',
  oil_filling: 'Oil Filling',
  testing: 'Testing',
  qc: 'Quality Check',
  dispatch: 'Dispatch',
  installation: 'Installation',
}

export interface NamedRef {
  id: string
  name: string
}

export interface RepairJobWithRelations extends RepairJob {
  customer: NamedRef
}

export interface RepairEstimateWithRelations extends RepairEstimate {
  repair_job: { id: string; job_number: string; customer: NamedRef }
}

export interface RepairEstimateItemWithProduct extends RepairEstimateItem {
  product: { id: string; sku: string; name: string; unit: { short_code: string } } | null
}

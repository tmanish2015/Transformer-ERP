import type { Tables } from '@/types/database.types'

export type Bom = Tables<'boms'>
export type BomLine = Tables<'bom_lines'>
export type ProductionOrder = Tables<'production_orders'>
export type RawMaterialRequirement = Tables<'raw_material_requirements'>
export type ProductionStageHistory = Tables<'production_stage_history'>

export type ProductionOrderStatus = 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type ProductionStage = 'winding' | 'assembly' | 'testing' | 'painting' | 'packing' | 'dispatch'

export const PRODUCTION_ORDER_STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  draft: 'Draft',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const PRODUCTION_STAGE_ORDER: ProductionStage[] = ['winding', 'assembly', 'testing', 'painting', 'packing', 'dispatch']

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  winding: 'Winding',
  assembly: 'Assembly',
  testing: 'Testing',
  painting: 'Painting',
  packing: 'Packing',
  dispatch: 'Dispatch',
}

export interface NamedRef {
  id: string
  name: string
}

export interface BomWithRelations extends Bom {
  product: NamedRef
}

export interface BomLineWithProduct extends BomLine {
  raw_material_product: { id: string; sku: string; name: string }
  unit: { id: string; short_code: string }
}

export interface ProductionOrderWithRelations extends ProductionOrder {
  product: NamedRef
  bom: { id: string; version: number; name: string | null }
  warehouse: NamedRef
}

export interface RawMaterialRequirementWithProduct extends RawMaterialRequirement {
  raw_material_product: { id: string; sku: string; name: string }
  unit: { id: string; short_code: string }
}

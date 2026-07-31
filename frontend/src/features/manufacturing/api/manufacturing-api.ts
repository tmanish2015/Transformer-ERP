import { supabase } from '@/lib/supabase'
import type { BomFormValues, ProductionOrderFormValues, ProductionStageHistoryFormValues } from '@/features/manufacturing/schemas/manufacturing-schemas'
import type {
  BomLineWithProduct,
  BomWithRelations,
  ProductionOrderWithRelations,
  ProductionStageHistory,
  RawMaterialRequirementWithProduct,
} from '@/features/manufacturing/types/manufacturing-types'

// ---------- BOMs ----------

export async function fetchBoms(): Promise<BomWithRelations[]> {
  const { data, error } = await supabase.from('boms').select('*, product:products(id,name)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchBomLines(bomId: string): Promise<BomLineWithProduct[]> {
  const { data, error } = await supabase.from('bom_lines').select('*, raw_material_product:products(id,sku,name), unit:units(id,short_code)').eq('bom_id', bomId)
  if (error) throw error
  return data
}

export async function createBom(values: BomFormValues) {
  const { data: existing, error: existingError } = await supabase.from('boms').select('version').eq('product_id', values.product_id).order('version', { ascending: false }).limit(1)
  if (existingError) throw existingError
  const nextVersion = (existing?.[0]?.version ?? 0) + 1

  const { data: bom, error } = await supabase.from('boms').insert({ product_id: values.product_id, name: values.name || null, version: nextVersion }).select().single()
  if (error) throw error

  const { error: linesError } = await supabase.from('bom_lines').insert(
    values.lines.map((line) => ({
      bom_id: bom.id,
      raw_material_product_id: line.raw_material_product_id,
      qty: line.qty,
      unit_id: line.unit_id,
    })),
  )
  if (linesError) throw linesError

  return bom
}

// ---------- Production Orders ----------

export async function fetchProductionOrders(): Promise<ProductionOrderWithRelations[]> {
  const { data, error } = await supabase
    .from('production_orders')
    .select('*, product:products(id,name), bom:boms(id,version,name), warehouse:warehouses(id,name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchProductionOrder(id: string): Promise<ProductionOrderWithRelations> {
  const { data, error } = await supabase
    .from('production_orders')
    .select('*, product:products(id,name), bom:boms(id,version,name), warehouse:warehouses(id,name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchRawMaterialRequirements(orderId: string): Promise<RawMaterialRequirementWithProduct[]> {
  const { data, error } = await supabase
    .from('raw_material_requirements')
    .select('*, raw_material_product:products(id,sku,name), unit:units(id,short_code)')
    .eq('production_order_id', orderId)
  if (error) throw error
  return data
}

export async function createProductionOrder(values: ProductionOrderFormValues) {
  const { data: bom, error: bomError } = await supabase.from('boms').select('product_id').eq('id', values.bom_id).single()
  if (bomError) throw bomError

  const { data: order, error } = await supabase
    .from('production_orders')
    .insert({ bom_id: values.bom_id, product_id: bom.product_id, quantity: values.quantity, warehouse_id: values.warehouse_id, notes: values.notes || null })
    .select()
    .single()
  if (error) throw error

  const { data: exploded, error: explodeError } = await supabase.rpc('explode_bom', { p_bom_id: values.bom_id, p_qty: values.quantity })
  if (explodeError) throw explodeError

  const { error: reqError } = await supabase.from('raw_material_requirements').insert(
    exploded.map((line) => ({
      production_order_id: order.id,
      raw_material_product_id: line.raw_material_product_id,
      required_qty: line.required_qty,
      unit_id: line.unit_id,
    })),
  )
  if (reqError) throw reqError

  return order
}

// ---------- Production Stage History ----------

export async function fetchProductionStageHistory(orderId: string): Promise<ProductionStageHistory[]> {
  const { data, error } = await supabase.from('production_stage_history').select('*').eq('production_order_id', orderId).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addProductionStageHistoryEntry(orderId: string, values: ProductionStageHistoryFormValues) {
  const { error } = await supabase.from('production_stage_history').insert({ production_order_id: orderId, stage: values.stage, notes: values.notes || null })
  if (error) throw error
}

// Company-wide, not order-scoped — used by the Order Cycle Time report to find each
// order's first-stage and dispatch timestamps without one query per order.
export async function fetchAllProductionStageHistory(): Promise<ProductionStageHistory[]> {
  const { data, error } = await supabase.from('production_stage_history').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ---------- Reports ----------

export interface ProductionConsumptionMovement {
  reference_id: string | null
  quantity: number
  product: { purchase_price: number } | null
}

export async function fetchProductionConsumptionMovements(): Promise<ProductionConsumptionMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('reference_id, quantity, product:products(purchase_price)')
    .eq('movement_type', 'production_consumption')
    .eq('reference_type', 'production_order')
  if (error) throw error
  return data
}

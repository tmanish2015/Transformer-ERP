import { supabase } from '@/lib/supabase'
import type { StockAdjustmentFormValues, BatchFormValues } from '@/features/inventory/schemas/inventory-schemas'

export interface StockLevelRow {
  product_id: string
  warehouse_id: string
  quantity: number
  updated_at: string
  product: { id: string; sku: string; name: string; reorder_level: number; unit: { short_code: string } }
  warehouse: { id: string; name: string; code: string }
}

export async function fetchStockLevels(): Promise<StockLevelRow[]> {
  const { data, error } = await supabase
    .from('stock_levels')
    .select('product_id, warehouse_id, quantity, updated_at, product:products(id,sku,name,reorder_level,unit:units(short_code)), warehouse:warehouses(id,name,code)')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data as unknown as StockLevelRow[]
}

export interface BatchRow {
  id: string
  batch_number: string
  manufacture_date: string | null
  expiry_date: string | null
  quantity: number
  created_at: string
  product: { id: string; sku: string; name: string }
  warehouse: { id: string; name: string }
}

export async function fetchBatches(): Promise<BatchRow[]> {
  const { data, error } = await supabase
    .from('product_batches')
    .select('id, batch_number, manufacture_date, expiry_date, quantity, created_at, product:products(id,sku,name), warehouse:warehouses(id,name)')
    .order('expiry_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data as unknown as BatchRow[]
}

export async function createBatch(values: BatchFormValues) {
  const { data: batch, error } = await supabase
    .from('product_batches')
    .insert({
      product_id: values.product_id,
      warehouse_id: values.warehouse_id,
      batch_number: values.batch_number,
      manufacture_date: values.manufacture_date || null,
      expiry_date: values.expiry_date || null,
      quantity: 0,
    })
    .select()
    .single()
  if (error) throw error

  if (values.quantity !== 0) {
    const { error: movementError } = await supabase.from('stock_movements').insert({
      product_id: values.product_id,
      warehouse_id: values.warehouse_id,
      batch_id: batch.id,
      movement_type: 'adjustment',
      quantity: values.quantity,
      reference_type: 'batch_opening',
      notes: 'Opening batch quantity',
    })
    if (movementError) throw movementError
  }

  return batch
}

export interface MovementRow {
  id: string
  movement_type: string
  quantity: number
  reference_type: string | null
  notes: string | null
  created_at: string
  product: { id: string; sku: string; name: string; unit: { short_code: string } }
  warehouse: { id: string; name: string }
  batch: { batch_number: string } | null
}

export async function fetchMovements(limit = 500): Promise<MovementRow[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, movement_type, quantity, reference_type, notes, created_at, product:products(id,sku,name,unit:units(short_code)), warehouse:warehouses(id,name), batch:product_batches(batch_number)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as MovementRow[]
}

export async function createStockMovement(values: StockAdjustmentFormValues) {
  const { error } = await supabase.from('stock_movements').insert({
    product_id: values.product_id,
    warehouse_id: values.warehouse_id,
    movement_type: values.movement_type,
    quantity: values.quantity,
    reference_type: 'manual',
    notes: values.notes || null,
  })
  if (error) throw error
}

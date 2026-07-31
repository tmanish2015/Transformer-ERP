import { supabase } from '@/lib/supabase'
import type { SerialNumberFormValues } from '@/features/inventory/schemas/inventory-schemas'

export interface SerialNumberRow {
  id: string
  serial_no: string
  current_status: string
  created_at: string
  product: { id: string; sku: string; name: string }
  current_warehouse: { id: string; name: string } | null
}

export async function fetchSerialNumbers(): Promise<SerialNumberRow[]> {
  const { data, error } = await supabase
    .from('serial_numbers')
    .select('id, serial_no, current_status, created_at, product:products(id,sku,name), current_warehouse:warehouses(id,name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as SerialNumberRow[]
}

export async function createSerialNumber(values: SerialNumberFormValues) {
  const { data, error } = await supabase
    .from('serial_numbers')
    .insert({ ...values, current_warehouse_id: values.current_warehouse_id || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSerialNumberStatus(id: string, current_status: string) {
  const { error } = await supabase.from('serial_numbers').update({ current_status }).eq('id', id)
  if (error) throw error
}

export async function deleteSerialNumber(id: string) {
  const { error } = await supabase.from('serial_numbers').delete().eq('id', id)
  if (error) throw error
}

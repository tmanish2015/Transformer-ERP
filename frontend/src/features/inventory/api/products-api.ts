import { supabase } from '@/lib/supabase'
import type { ProductFormValues } from '@/features/inventory/schemas/inventory-schemas'
import type { ProductWithRelations } from '@/features/inventory/types/inventory-types'

export async function fetchProducts(): Promise<ProductWithRelations[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id,name), brand:brands(id,name), unit:units(id,name,short_code), stock_levels(quantity)')
    .order('name')
  if (error) throw error

  return data.map((p) => {
    const { stock_levels, ...rest } = p
    return {
      ...rest,
      total_stock: (stock_levels ?? []).reduce((sum, sl) => sum + Number(sl.quantity), 0),
    }
  })
}

export async function createProduct(values: ProductFormValues) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...values,
      category_id: values.category_id || null,
      brand_id: values.brand_id || null,
      description: values.description || null,
      hsn_code: values.hsn_code || null,
      barcode: values.barcode || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, values: Partial<ProductFormValues>) {
  const { data, error } = await supabase.from('products').update(values).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllProducts() {
  const { error } = await supabase.from('products').delete().not('id', 'is', null)
  if (error) throw error
}

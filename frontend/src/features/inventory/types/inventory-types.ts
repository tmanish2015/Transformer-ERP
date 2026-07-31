import type { Tables } from '@/types/database.types'

export type Unit = Tables<'units'>
export type Category = Tables<'categories'>
export type Brand = Tables<'brands'>
export type Warehouse = Tables<'warehouses'>
export type Supplier = Tables<'suppliers'>
export type Product = Tables<'products'>
export type ProductSupplier = Tables<'product_suppliers'>
export type ProductBatch = Tables<'product_batches'>
export type SerialNumber = Tables<'serial_numbers'>
export type ScrapEntry = Tables<'scrap_entries'>
export type StockLevel = Tables<'stock_levels'>
export type StockMovement = Tables<'stock_movements'>

export interface ProductWithRelations extends Product {
  category: Pick<Category, 'id' | 'name'> | null
  brand: Pick<Brand, 'id' | 'name'> | null
  unit: Pick<Unit, 'id' | 'name' | 'short_code'>
  total_stock: number
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export function getStockStatus(quantity: number, reorderLevel: number): StockStatus {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= reorderLevel) return 'low_stock'
  return 'in_stock'
}

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  adjustment: 'Adjustment',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  return: 'Return',
  scrap: 'Scrap',
}

// Manually selectable in the Record Movement dialog. 'scrap' is deliberately excluded —
// it's only ever written by the scrap_entries flow (with its own reason/audit fields),
// never picked freehand, even though it's a valid movement_type for display purposes.
export const MANUAL_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  adjustment: 'Adjustment',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  return: 'Return',
}

export const SERIAL_STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  reserved: 'Reserved',
  dispatched: 'Dispatched',
  installed: 'Installed',
  scrapped: 'Scrapped',
}

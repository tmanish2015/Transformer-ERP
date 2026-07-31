import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type LookupTable = 'units' | 'categories' | 'brands' | 'warehouses' | 'suppliers'
type Row<T extends LookupTable> = Database['public']['Tables'][T]['Row']
type Insert<T extends LookupTable> = Database['public']['Tables'][T]['Insert']
type Update<T extends LookupTable> = Database['public']['Tables'][T]['Update']

export function createLookupApi<T extends LookupTable>(table: T, orderBy = 'name') {
  // The table name is generic here, which defeats supabase-js's literal-type-based
  // overload resolution. We cast at the client boundary and rely on the strongly
  // typed public signatures (Row/Insert/Update<T>) for safety at call sites.
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => { order: (col: string) => Promise<{ data: unknown; error: Error | null }> }
      insert: (values: unknown) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> } }
      update: (
        values: unknown,
      ) => { eq: (col: string, value: string) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> } } }
      delete: () => { eq: (col: string, value: string) => Promise<{ error: Error | null }>; not: (col: string, op: string, value: null) => Promise<{ error: Error | null }> }
    }
  }

  return {
    list: async (): Promise<Row<T>[]> => {
      const { data, error } = await client.from(table).select('*').order(orderBy)
      if (error) throw error
      return data as Row<T>[]
    },
    create: async (values: Insert<T>): Promise<Row<T>> => {
      const { data, error } = await client.from(table).insert(values).select().single()
      if (error) throw error
      return data as Row<T>
    },
    update: async (id: string, values: Update<T>): Promise<Row<T>> => {
      const { data, error } = await client.from(table).update(values).eq('id', id).select().single()
      if (error) throw error
      return data as Row<T>
    },
    remove: async (id: string): Promise<void> => {
      const { error } = await client.from(table).delete().eq('id', id)
      if (error) throw error
    },
    removeAll: async (): Promise<void> => {
      const { error } = await client.from(table).delete().not('id', 'is', null)
      if (error) throw error
    },
  }
}

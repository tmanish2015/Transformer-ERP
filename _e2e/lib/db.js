import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config.js'

/**
 * DB cross-check helper — signs in with the known test credentials and runs a query,
 * returning structured results. This mirrors exactly what the frontend API layer does,
 * so a UI PASS plus a DB PASS is conclusive end-to-end proof.
 */
export async function withDb(fn) {
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: CONFIG.email,
    password: CONFIG.password,
  })
  if (signInError || !sessionData.session) {
    throw new Error(`DB sign-in failed: ${signInError?.message}`)
  }
  return fn(supabase)
}

export async function dbFindProduct(sku) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from('products').select('*').eq('sku', sku).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

export async function dbFindByName(table, name) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).select('*').eq('name', name).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

export async function dbCount(table) {
  return withDb(async (supabase) => {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return { count, error: error?.message ?? null }
  })
}

export async function dbList(table, { orderBy = 'name' } = {}) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).select('*').order(orderBy)
    return { data: data ?? [], error: error?.message ?? null }
  })
}

export async function dbDeleteById(table, id) {
  return withDb(async (supabase) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    return { error: error?.message ?? null }
  })
}

export async function dbInsert(table, values) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).insert(values).select().single()
    return { data, error: error?.message ?? null }
  })
}


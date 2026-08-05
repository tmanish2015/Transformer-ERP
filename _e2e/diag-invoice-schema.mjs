// Probe the live sales_invoice_items / sales_invoices schema to find why the
// rental invoice insert fails with a 400.
import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './lib/config.js'

async function main() {
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: CONFIG.email,
    password: CONFIG.password,
  })
  if (signInError) { console.log('SIGNIN_ERROR:', signInError.message); process.exit(1) }
  console.log('Signed in OK')

// Get a real customer id
  const { data: cust, error: custErr } = await supabase.from('customers').select('id').limit(1).maybeSingle()
  console.log('real customer:', { id: cust?.id, error: custErr?.message })
  if (!cust?.id) { console.log('No customer available'); process.exit(1) }

  // Try inserting a minimal invoice item with description only (no product_id)
  // to reproduce the 400. First insert a throwaway invoice.
  const { data: inv, error: invErr } = await supabase
    .from('sales_invoices')
    .insert({ customer_id: cust.id, invoice_type: 'rental', notes: 'schema probe' })
    .select()
    .maybeSingle()
  console.log('sales_invoices insert:', { data: inv, error: invErr?.message })

  // Try inserting an item with description only
  const { data: item, error: itemErr } = await supabase
    .from('sales_invoice_items')
    .insert({ sales_invoice_id: inv?.id ?? '00000000-0000-0000-0000-000000000000', description: 'probe line', quantity: 1, unit_price: 100, gst_rate: 18 })
    .select()
    .maybeSingle()
  console.log('sales_invoice_items insert (description-only):', { data: item, error: itemErr?.message })

  // Try inserting an item with product_id null explicitly
  const { data: item2, error: itemErr2 } = await supabase
    .from('sales_invoice_items')
    .insert({ sales_invoice_id: inv?.id ?? '00000000-0000-0000-0000-000000000000', product_id: null, description: 'probe line 2', quantity: 1, unit_price: 100, gst_rate: 18 })
    .select()
    .maybeSingle()
  console.log('sales_invoice_items insert (null product_id):', { data: item2, error: itemErr2?.message })

  // Clean up the throwaway invoice if created
  if (inv?.id) {
    const { error: delErr } = await supabase.from('sales_invoices').delete().eq('id', inv.id)
    console.log('cleanup invoice:', { error: delErr?.message })
  }
}

main().catch(console.error)

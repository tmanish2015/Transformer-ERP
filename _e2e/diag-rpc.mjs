// Diagnostic: check if calculate_rental_invoice RPC exists and is callable
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

  // 1. Try calling the RPC directly with a bogus UUID to check if function exists
  const { data: rpc1, error: err1 } = await supabase.rpc('calculate_rental_invoice', { p_agreement_id: '00000000-0000-0000-0000-000000000000' })
  console.log('RPC with bogus UUID:', { data: rpc1, error: err1?.message })

  // 2. Check what functions exist by querying pg_proc
  // Note: supabase.from('pg_proc') may not be accessible, but we can try
  const { data: pgProc, error: pgErr } = await supabase.from('pg_proc').select('proname, pronargs').like('proname', 'calculate_rental_invoice')
  console.log('pg_proc calculate_rental_invoice:', { data: pgProc, error: pgErr?.message })

  // 3. Try a SQL query via rpc
  const { data: rpc2, error: err2 } = await supabase.rpc('calculate_rental_invoice', {})
  console.log('RPC with no args:', { data: rpc2, error: err2?.message })

  // 4. Check if post_sales_invoice_to_ledger exists (known working function)
  const { data: rpc3, error: err3 } = await supabase.rpc('post_sales_invoice_to_ledger', { p_invoice_id: '00000000-0000-0000-0000-000000000000' })
  console.log('post_sales_invoice_to_ledger RPC:', { data: rpc3, error: err3?.message })

  // 5. Check if the migration was applied by looking at the rental_agreements table
  const { data: tables, error: tablesErr } = await supabase.from('rental_agreements').select('id').limit(1)
  console.log('rental_agreements table:', { data: tables, error: tablesErr?.message })

  // 6. Try calling the function via raw SQL
  const { data: rpc4, error: err4 } = await supabase.rpc('calculate_rental_invoice', { p_agreement_id: '00000000-0000-0000-0000-000000000000' })
  console.log('RPC retry:', { data: rpc4, error: err4?.message, type: typeof err4 })
  if (err4) {
    console.log('Error details:', JSON.stringify(err4, null, 2))
  }
}

main().catch(console.error)

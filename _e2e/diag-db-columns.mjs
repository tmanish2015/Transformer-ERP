// Check the live DB customers table has gstin, pan_number, state, state_code columns.
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

  const { data, error } = await supabase.from('customers').select('id, gstin, pan_number, state, state_code').limit(1)
  console.log('customers select with new columns:', { data, error: error?.message })
  if (error) {
    console.log('NEW COLUMNS MISSING — migration 20260820090000_company_settings_and_gst_fields.sql may not be applied.')
  } else {
    console.log('NEW COLUMNS PRESENT (gstin, pan_number, state, state_code)')
  }
}

main().catch(console.error)


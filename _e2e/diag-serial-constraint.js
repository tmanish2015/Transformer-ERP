import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './lib/config.js'

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: s, error: serr } = await supabase.auth.signInWithPassword({ email: CONFIG.email, password: CONFIG.password })
if (serr || !s.session) { console.log('sign-in failed', serr?.message); process.exit(1) }

// Try an insert with serial_no = null (as the API does when blank) to see if NOT NULL violates
const { data: customers } = await supabase.from('customers').select('id').limit(1)
const customerId = customers?.[0]?.id
if (!customerId) { console.log('no customer'); process.exit(1) }

const regNo = `BLANK-${Date.now()}`
const { data: insNull, error: errNull } = await supabase
  .from('transformers')
  .insert({ customer_id: customerId, registration_no: regNo, make: 'TEST', model: 'M', capacity_kva: 10, current_status: 'IN SERVICE', serial_no: null })
  .select()
  .maybeSingle()
console.log('INSERT serial_no=null:', JSON.stringify({ error: errNull?.message ?? null, data: insNull ? { id: insNull.id, serial_no: insNull.serial_no } : null }, null, 2))

// Cleanup if inserted
if (insNull?.id) {
  await supabase.from('transformers').delete().eq('id', insNull.id)
  console.log('cleaned up blank-serial insert')
}

// Try insert with explicit serial_no
const regNo2 = `EXPLICIT-${Date.now()}`
const { data: insExplicit, error: errExplicit } = await supabase
  .from('transformers')
  .insert({ customer_id: customerId, registration_no: regNo2, make: 'TEST', model: 'M', capacity_kva: 10, current_status: 'IN SERVICE', serial_no: 'ABC-123' })
  .select()
  .maybeSingle()
console.log('INSERT serial_no explicit:', JSON.stringify({ error: errExplicit?.message ?? null, data: insExplicit ? { id: insExplicit.id, serial_no: insExplicit.serial_no } : null }, null, 2))
if (insExplicit?.id) {
  await supabase.from('transformers').delete().eq('id', insExplicit.id)
  console.log('cleaned up explicit-serial insert')
}

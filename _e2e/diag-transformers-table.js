import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './lib/config.js'

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: s, error: serr } = await supabase.auth.signInWithPassword({ email: CONFIG.email, password: CONFIG.password })
if (serr || !s.session) {
  console.log('sign-in failed', serr?.message)
  process.exit(1)
}

// Does the transformers table exist / is it queryable?
const { data: list, error: listErr } = await supabase.from('transformers').select('*').limit(5)
console.log('LIST transformers:', JSON.stringify({ error: listErr?.message ?? null, count: list?.length ?? 0, sample: list?.[0] ?? null }, null, 2))

// Any QA-REG rows created by the regression?
const { data: qa, error: qaErr } = await supabase.from('transformers').select('*').like('registration_no', 'QA-%')
console.log('QA transformers:', JSON.stringify({ error: qaErr?.message ?? null, rows: qa?.length ?? 0 }, null, 2))
qa?.forEach((r) => console.log('  ', r.registration_no, r.serial_no, r.make, r.model, r.capacity_kva, r.company_id))

// Check table column info via a raw head
const { data: head, error: headErr } = await supabase.from('transformers').select('*', { count: 'exact', head: true })
console.log('HEAD (count):', JSON.stringify({ error: headErr?.message ?? null, count: head?.length ?? null }))

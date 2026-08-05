import { CONFIG } from './lib/config.js'
import { createClient } from '@supabase/supabase-js'

const s = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
  auth: { persistSession: false },
})

const { data, error } = await s.auth.signInWithPassword({ email: CONFIG.email, password: CONFIG.password })
if (error) {
  console.log('LOGIN ERR', error.message)
  process.exit(1)
}
const uid = data.user.id
const { data: prof } = await s.from('profiles').select('id,role,company_id').eq('id', uid).maybeSingle()
console.log('PROFILE', JSON.stringify(prof))
const { data: rp } = await s.from('role_permissions').select('permission_id:permissions(code)').eq('role_id', prof?.role)
console.log('ROLE_PERMS', JSON.stringify(rp))
const { data: allPerms } = await s.from('permissions').select('code')
console.log('workshop.view exists:', allPerms?.some((p) => p.code === 'workshop.view'))
process.exit(0)

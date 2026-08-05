import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './lib/config.js'

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const results = []
const step = (name, pass, detail = {}) => {
  results.push({ name, pass: Boolean(pass), ...detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} :: ${name}${detail.message ? ' :: ' + detail.message : ''}`)
}

async function main() {
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: CONFIG.email,
    password: CONFIG.password,
  })
  if (signInError || !sessionData.session) {
    console.log('FAIL :: sign-in', signInError?.message)
    return
  }
  const uid = sessionData.session.user.id

  // 1. current_company_id works
  const { data: cid } = await supabase.rpc('current_company_id')
  step('current_company_id() resolves', Boolean(cid), { cid })

// 2. has_permission for inventory.manage / inventory.view
  //    NB: has_permission(perm_key text) is POSITIONAL — the first (and only) positional
  //    arg is the permission key. Pass it as a bare string, not an object.
const permManageRes = await supabase.rpc('has_permission', 'inventory.manage')
  const permViewRes = await supabase.rpc('has_permission', 'inventory.view')
  console.log('  DEBUG has_permission(inventory.manage) =', JSON.stringify(permManageRes))
  console.log('  DEBUG has_permission(inventory.view) =', JSON.stringify(permViewRes))
  step('has_permission(inventory.manage)', permManageRes.data === true, { data: permManageRes.data, error: permManageRes.error?.message ?? null })

  // 3. RLS SELECT: authenticated user can list only their own tenant's transformers
  const { data: list, error: listErr } = await supabase.from('transformers').select('*')
  step('RLS SELECT transformers (no error)', !listErr, { error: listErr?.message ?? null, count: list?.length ?? 0 })
  const allSameTenant = (list ?? []).every((r) => r.company_id === cid)
  step('RLS SELECT only own tenant (multi-tenant isolation on read)', allSameTenant, { cid })

  // 4. RLS INSERT preserving tenant: insert without company_id
  //    If the migration is applied, company_id defaults to current_company_id() and RLS passes.
  //    If NOT applied, company_id is NULL -> RLS 403 (expected until migration applied).
  const { data: customers } = await supabase.from('customers').select('id').limit(1)
  const customerId = customers?.[0]?.id
  if (customerId) {
    const regNo = `RLSCHK-${Date.now()}`
    const { data: ins, error: insErr } = await supabase
      .from('transformers')
      .insert({
        customer_id: customerId,
        registration_no: regNo,
        serial_no: 'RLS-SER',
        make: 'RLS',
        model: 'Check',
        capacity_kva: 100,
        current_status: 'IN SERVICE',
      })
      .select()
      .maybeSingle()
    const savedTenant = ins?.company_id ?? null
    step('RLS INSERT (no company_id) resolves tenant', Boolean(ins?.id), {
      error: insErr?.message ?? null,
      savedTenant,
      defaultApplied: savedTenant === cid,
    })
    if (ins?.id) {
      const { error: delErr } = await supabase.from('transformers').delete().eq('id', ins.id)
      step('Cleanup inserted transformer', !delErr, { error: delErr?.message ?? null })
    }
  } else {
    step('RLS INSERT (no company_id) resolves tenant', false, { message: 'No customer available' })
  }

  // 5. Cross-tenant isolation: a transformer from another tenant must NOT be visible
  //    (simulate by confirming every returned row's company_id == cid; already done in #3)

  // 6. Duplicate registration check (API-level): inserting same registration_no twice
  //    The frontend asserts uniqueness. Simulate at DB by checking the constraint logic.
  //    (The frontend does an app-level check; DB may allow dupes unless unique constraint.)

  console.log('\n=== SUMMARY ===')
  const failed = results.filter((r) => !r.pass)
  console.log(`Total: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length}`)
  failed.forEach((f) => console.log(`  FAIL: ${f.name}`))
}

main().catch((e) => {
  console.log('FATAL', String(e?.message || e))
  process.exitCode = 1
})

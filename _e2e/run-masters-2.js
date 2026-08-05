// _e2e/run-masters-2.js — Phase 2 live verification for Categories, Brands, Customers, Suppliers.
// Each module follows the same proven E2E flow as Product Master:
//   navigate → create → appears in list → DB persisted → reload persists → edit (UI+DB) →
//   search finds → clear search → delete → gone from UI → gone from DB.
// Runs all four modules sequentially, recording per-phase step results.
import { Harness } from './lib/harness.js'
import { withDb } from './lib/db.js'

const h = new Harness()

const ts = () => Date.now().toString().slice(-6)

async function findByName(table, name) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).select('*').eq('name', name).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

// ---------- Module definitions ----------
const MODULES = [
  {
    phase: 'categories',
    title: 'Categories',
    route: '/inventory/categories',
    table: 'categories',
    addButton: 'Add Category',
    createButton: 'Create category',
    editButton: 'Save changes',
    searchPlaceholder: 'Search categories...',
    deleteTitle: 'Delete category?',
    namePrefix: 'E2E Category',
    fields: [['#description', 'E2E auto-test category description']],
  },
  {
    phase: 'brands',
    title: 'Brands',
    route: '/inventory/brands',
    table: 'brands',
    addButton: 'Add Brand',
    createButton: 'Create brand',
    editButton: 'Save changes',
    searchPlaceholder: 'Search brands...',
    deleteTitle: 'Delete brand?',
    namePrefix: 'E2E Brand',
    fields: [],
  },
  {
    phase: 'customers',
    title: 'Customers',
    route: '/sales/customers',
    table: 'customers',
    addButton: 'Add Customer',
    createButton: 'Create customer',
    editButton: 'Save changes',
    searchPlaceholder: 'Search customers...',
    deleteTitle: 'Delete customer?',
    namePrefix: 'E2E Customer',
    fields: [
      ['#contact_person', 'E2E Contact'],
      ['#phone', '9876543210'],
      ['#email', `e2e-cust-${ts()}@test.com`],
      ['#gstin', '22AAAAA0000A1Z5'],
      ['#billing_address', 'E2E Billing Address'],
      ['#shipping_address', 'E2E Shipping Address'],
      ['#credit_limit', '100000'],
      ['#credit_days', '30'],
    ],
  },
  {
    phase: 'suppliers',
    title: 'Suppliers',
    route: '/inventory/suppliers',
    table: 'suppliers',
    addButton: 'Add Supplier',
    createButton: 'Create supplier',
    editButton: 'Save changes',
    searchPlaceholder: 'Search suppliers...',
    deleteTitle: 'Delete supplier?',
    namePrefix: 'E2E Supplier',
    fields: [
      ['#contact_person', 'E2E Vendor Contact'],
      ['#phone', '9876543211'],
      ['#email', `e2e-supplier-${ts()}@test.com`],
      ['#gstin', '27BBBBB0000B1Z5'],
      ['#address', 'E2E Supplier Address'],
    ],
  },
]

async function runModule(mod) {
  const NAME = `${mod.namePrefix} ${ts()}`
  const EDIT_NAME = `${NAME} EDITED`
  const phase = mod.phase
  let modulePassed = true

  try {
    // ---------- Navigate ----------
    await h.goto(mod.route)
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    const bodyText = await h.readBodyText()
    h.step(phase, 'Navigate to page', bodyText.includes(mod.title), { snippet: bodyText.slice(0, 120) })
    await h.screenshot(`${phase}-initial`)

    // ---------- Create ----------
    await h.clickButton(mod.addButton)
    await h.waitForSelector('#name', { timeout: 20000 })
    h.step(phase, 'Open create dialog', true)
    await h.type('#name', NAME)
    for (const [sel, val] of mod.fields) {
      await h.type(sel, val)
    }
    await h.screenshot(`${phase}-form-filled`)
    await h.clickButton(mod.createButton)

    // Wait for dialog close (success)
    await h.waitForFunction(() => !document.querySelector('#name'), { timeout: 20000 })

    // Verify appears in list (UI)
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, NAME)
    const listHas = await h.textExists(NAME)
    h.step(phase, 'Create: appears in list', listHas)

    // Verify in DB
    const dbCreate = await findByName(mod.table, NAME)
    h.step(phase, 'Create: persisted in DB', Boolean(dbCreate.data), { dbName: dbCreate.data?.name })
    await h.screenshot(`${phase}-created`)

    // ---------- Reload / persistence ----------
    let persists = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await h.goto(mod.route, { waitUntil: 'networkidle0' })
        await h.waitForSelector('table', { timeout: 20000 })
        await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, NAME)
        persists = await h.textExists(NAME)
        if (persists) break
      } catch (e) {
        h.logLine('warn', `${phase} reload attempt ${attempt} failed: ${String(e?.message || e)}`)
        if (attempt === 3) throw e
        await new Promise((r) => setTimeout(r, 3000))
      }
    }
    h.step(phase, 'Reload: persists after refresh', persists)
    await h.screenshot(`${phase}-after-reload`)

    // ---------- Edit ----------
    await h.openRowMenu(NAME)
    await h.clickDropdownItem('Edit')
    await h.waitForSelector('#name', { timeout: 20000 })
    await h.type('#name', EDIT_NAME)
    await h.clickButton(mod.editButton)
    await h.waitForFunction(() => !document.querySelector('#name'), { timeout: 20000 })

    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, EDIT_NAME)
    const editUi = await h.textExists(EDIT_NAME)
    h.step(phase, 'Edit: updated name appears in list', editUi)

    const dbEdit = await findByName(mod.table, EDIT_NAME)
    h.step(phase, 'Edit: updated name persisted in DB', Boolean(dbEdit.data), { dbName: dbEdit.data?.name })
    await h.screenshot(`${phase}-edited`)

    // ---------- Search ----------
    await h.setSearchInput(mod.searchPlaceholder, EDIT_NAME)
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, EDIT_NAME)
    const searchFound = await h.textExists(EDIT_NAME)
    h.step(phase, 'Search: found by name', searchFound)
    await h.screenshot(`${phase}-search`)

    // Clear search so the row menu is reachable again
    await h.setSearchInput(mod.searchPlaceholder, '')
    await new Promise((r) => setTimeout(r, 800))

    // ---------- Delete ----------
    await h.openRowMenu(EDIT_NAME)
    await h.clickDropdownItem('Delete')
    await h.waitForText(mod.deleteTitle)
    h.logLine('info', `${phase}: delete confirm dialog appeared`)
    await h.clickButton('Delete')
    await h.page.waitForFunction((n) => !document.body.innerText.includes(n), { timeout: 15000 }, EDIT_NAME)
    const deletedUi = !(await h.textExists(EDIT_NAME))
    h.step(phase, 'Delete: removed from list', deletedUi)

    const dbDelete = await findByName(mod.table, EDIT_NAME)
    h.step(phase, 'Delete: removed from DB', !dbDelete.data)
    await h.screenshot(`${phase}-deleted`)
  } catch (err) {
    h.logLine('error', `${phase}: ${String(err?.stack || err)}`)
    h.step(phase, 'run', false, { message: String(err?.message || err) })
    modulePassed = false
    try {
      await h.screenshot(`${phase}-failure`)
      const body = await h.readBodyText()
      h.logLine('error', `${phase} page text on failure: ${body.slice(0, 600)}`)
    } catch {}
  }

  const steps = h.stepResults.filter((s) => s.phase === phase)
  const passed = steps.length > 0 && steps.every((s) => s.pass)
  return passed && modulePassed
}

async function main() {
  try {
    await h.start()
    await h.login()

    const results = {}
    for (const mod of MODULES) {
      const ok = await runModule(mod)
      results[mod.phase] = ok ? 'PASS' : 'FAIL'
      h.logLine('info', `Module ${mod.phase}: ${results[mod.phase]}`)
    }

    const allPass = Object.values(results).every((v) => v === 'PASS')
    console.log('MASTERS_2_SUMMARY:', JSON.stringify(results))
    console.log('MASTERS_2_RESULT:', allPass ? 'PASS' : 'FAIL')
  } catch (err) {
    h.logLine('error', String(err?.stack || err))
    console.log('MASTERS_2_RESULT: FAIL')
  } finally {
    h.saveResults()
    await h.stop()
  }
}

main()


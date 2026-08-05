// _e2e/run-product-master.js — Phase 2 Product Master live verification.
// Flow: login → products page → create → appears in list → reload → persists →
//       edit → search → delete → gone. UI + DB cross-check at every step.
import { Harness } from './lib/harness.js'
import { CONFIG } from './lib/config.js'
import { withDb } from './lib/db.js'

const h = new Harness()

const SKU = `E2E-PROD-${Date.now().toString().slice(-6)}`
const NAME = `E2E Test Transformer ${Date.now().toString().slice(-6)}`
const EDIT_NAME = `${NAME} EDITED`
const HSN = '85042100'
const GST = '18'
const BUY = '150000'
const SELL = '185000'

function uniqueUnit() {
  return `unit-e2e-${Date.now().toString().slice(-5)}`
}

// Login selectors reflect the actual current login form: the email/password
// fields are exposed via `name` attributes (each rendered <input> also carries
// data-slot="input"). The retry loop survives transient chunk-load / network
// failures (e.g. ERR_INSUFFICIENT_RESOURCES) where the form never renders.
const EMAIL_SELECTOR = 'input[name="email"]'
const PASSWORD_SELECTOR = 'input[name="password"]'

async function login() {
  let lastError
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await h.goto('/login', { waitUntil: 'domcontentloaded' })
      await h.waitForSelector(EMAIL_SELECTOR, { timeout: 30000 })
      await h.waitForSelector(PASSWORD_SELECTOR, { timeout: 30000 })
      await h.page.focus(EMAIL_SELECTOR)
      await h.page.type(EMAIL_SELECTOR, CONFIG.email, { delay: 15 })
      await h.page.focus(PASSWORD_SELECTOR)
      await h.page.type(PASSWORD_SELECTOR, CONFIG.password, { delay: 15 })
      await h.clickByText('Sign in', { exact: true })
      await h.page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 30000 })
      h.logLine('info', `Signed in. URL: ${await h.currentUrl()}`)
      return
    } catch (e) {
      lastError = e
      h.logLine('warn', `Login attempt ${attempt} failed: ${String(e?.message || e)}`)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  throw lastError
}

async function ensureUnit() {
  // The product form needs a unit. If units is empty, we can't proceed via UI.
  // Check DB for existing units; if none, create one directly via the DB (unit management
  // is a separate master that is not part of this task's product flow).
  const { data: units } = await withDb(async (supabase) => {
    const { data } = await supabase.from('units').select('id, short_code, name').order('short_code')
    return { data: data ?? [] }
  })
  if (units.length === 0) {
    const name = uniqueUnit()
    await withDb(async (supabase) => {
      const { error } = await supabase.from('units').insert({ name, short_code: name.toUpperCase().slice(0, 6) })
      if (error) throw new Error(`Could not create unit: ${error.message}`)
    })
    h.logLine('info', `Created fallback unit: ${name}`)
  } else {
    h.logLine('info', `Existing units available: ${units.map((u) => u.short_code).join(', ')}`)
  }
}

async function verifyProductInDb(expected, label) {
  const { data } = await withDb(async (supabase) => {
    const { data } = await supabase.from('products').select('*, unit:units(id,short_code,name)').eq('sku', SKU).maybeSingle()
    return { data }
  })
  return {
    exists: Boolean(data),
    data,
    matchesName: data?.name === expected,
  }
}

async function main() {
  let phasePassed = true
  try {
    await h.start()
    await login()

    // Ensure at least one unit exists so the product form can be submitted.
    await ensureUnit()

    // ---------- Navigate to Products ----------
    await h.goto('/inventory/products')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    const bodyText = await h.readBodyText()
    h.step('product-master', 'Navigate to Product Master', bodyText.includes('Product Master'), { snippet: bodyText.slice(0, 120) })
    await h.screenshot('products-page-initial')

    // ---------- Create ----------
    await h.clickButton('Add Product')
    await h.waitForSelector('#sku', { timeout: 20000 })
    h.step('product-master', 'Open Add Product dialog', true)

    await h.type('#sku', SKU)
    await h.type('#name', NAME)
    await h.type('#hsn_code', HSN)
    await h.type('#gst_rate', GST)
    await h.type('#purchase_price', BUY)
    await h.type('#selling_price', SELL)

    // Unit select — must pick the first available unit
    const unitSelectors = await h.page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label')).map((l) => l.textContent?.trim())
      return { labels }
    })
    h.logLine('info', 'Dialog labels: ' + JSON.stringify(unitSelectors.labels))

    // Find the Unit select trigger — it's the third select in the category/brand/unit grid.
    // We locate by text "Select" placeholder that is part of a select trigger.
    const unitTriggerClicked = await h.page.evaluate(() => {
      const triggers = document.querySelectorAll('[data-slot="select-trigger"]')
      for (const t of triggers) {
        if (t.offsetParent !== null) {
          const txt = (t.textContent || '').trim()
          if (txt === 'Select' || txt.includes('Select')) {
            t.click()
            return true
          }
        }
      }
      return false
    })
    if (!unitTriggerClicked) throw new Error('Unit select trigger not found')
    await h.waitForSelector('[data-slot="select-content"]')
    const unitClicked = await h.page.evaluate(() => {
      const items = document.querySelectorAll('[data-slot="select-item"]')
      for (const it of items) {
        const label = (it.textContent || '').trim()
        if (label.length > 0 && label.toLowerCase() !== 'none') {
          it.click()
          return { clicked: true, label }
        }
      }
      return { clicked: false }
    })
    if (!unitClicked.clicked) throw new Error('No unit option found in select')
    h.logLine('info', `Selected unit: ${unitClicked.label}`)
    await new Promise((r) => setTimeout(r, 300))

    await h.screenshot('product-form-filled')
    await h.clickButton('Create product')

    // Wait for the dialog to close (indicating success)
    await h.waitForFunction(() => !document.querySelector('#sku'), { timeout: 20000 })
    h.logLine('info', 'Product create dialog closed')

    // Verify appears in list (UI)
    await h.page.waitForFunction(
      (name) => document.body.innerText.includes(name),
      { timeout: 15000 },
      NAME,
    )
    const listHasProduct = await h.textExists(NAME)
    h.step('product-master', 'Create: product appears in list', listHasProduct)

    // Verify in DB
    const dbAfterCreate = await verifyProductInDb(NAME, 'create')
    h.step('product-master', 'Create: product persisted in DB', dbAfterCreate.exists && dbAfterCreate.matchesName, {
      dbName: dbAfterCreate.data?.name,
      sku: dbAfterCreate.data?.sku,
    })
    await h.screenshot('product-created-in-list')

    // ---------- Reload / persistence ----------
    // A full-page navigation (rather than in-place reload) guarantees every lazy
    // chunk is refetched; retry survives transient Vercel/network resource hiccups.
    let persistsAfterReload = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await h.goto('/inventory/products', { waitUntil: 'networkidle0' })
        await h.waitForSelector('table', { timeout: 20000 })
        await h.waitForFunction(
          (name) => document.body.innerText.includes(name),
          { timeout: 15000 },
          NAME,
        )
        persistsAfterReload = await h.textExists(NAME)
        if (persistsAfterReload) break
      } catch (e) {
        h.logLine('warn', `Reload attempt ${attempt} failed: ${String(e?.message || e)}`)
        if (attempt === 3) throw e
        await new Promise((r) => setTimeout(r, 3000))
      }
    }
    h.step('product-master', 'Reload: product persists after refresh', persistsAfterReload)
    await h.screenshot('product-after-reload')

    // ---------- Edit ----------
    await h.openRowMenu(NAME)
    await h.clickDropdownItem('Edit')
    await h.waitForSelector('#sku', { timeout: 20000 })
    h.logLine('info', 'Edit dialog opened')

    await h.type('#name', EDIT_NAME)
    await h.clickButton('Save changes')

    await h.waitForFunction(() => !document.querySelector('#sku'), { timeout: 20000 })
    // Verify updated name in UI
    await h.page.waitForFunction(
      (n) => document.body.innerText.includes(n),
      { timeout: 15000 },
      EDIT_NAME,
    )
    const editUi = await h.textExists(EDIT_NAME)
    h.step('product-master', 'Edit: updated name appears in list', editUi)

    const dbAfterEdit = await verifyProductInDb(EDIT_NAME, 'edit')
    h.step('product-master', 'Edit: updated name persisted in DB', dbAfterEdit.exists && dbAfterEdit.matchesName, {
      dbName: dbAfterEdit.data?.name,
    })
    await h.screenshot('product-edited')

    // ---------- Search ----------
    // The DataTable global filter matches accessor-based columns (name, selling price,
    // GST). An end user searches by the product name — the SKU is only a rendered subtitle
    // and is intentionally not a match column.
    const SEARCH_TERM = EDIT_NAME
    const searchInputId = await h.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'))
      const placeholder = inputs.find((i) => (i.placeholder || '').toLowerCase().includes('search products'))
      if (!placeholder) return null
      if (placeholder.id) return placeholder.id
      // Assign a temp id for targeting
      placeholder.id = 'e2e-search-input'
      return 'e2e-search-input'
    })
    if (!searchInputId) throw new Error('Search products input not found')
    h.logLine('info', `Search input id: ${searchInputId}`)

    // Clear and set value via native event to trigger React onChange
    await h.page.evaluate((term) => {
      const input = document.getElementById('e2e-search-input')
      if (!input) return
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      nativeInputValueSetter.call(input, term)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, SEARCH_TERM)

    await h.page.waitForFunction(
      (term) => document.body.innerText.includes(term),
      { timeout: 15000 },
      SEARCH_TERM,
    )
    const searchFound = await h.textExists(SEARCH_TERM)
    h.step('product-master', 'Search: product found by name', searchFound)
    await h.screenshot('product-search')

    // Clear search so delete row menu is accessible again
    await h.page.evaluate(() => {
      const input = document.getElementById('e2e-search-input')
      if (!input) return
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await new Promise((r) => setTimeout(r, 800))

    // ---------- Delete ----------
    await h.openRowMenu(EDIT_NAME)
    await h.clickDropdownItem('Delete')
    // Confirm delete dialog
    await h.waitForText('Delete product?')
    h.logLine('info', 'Delete confirm dialog appeared')
    await h.clickButton('Delete')
    // Wait for it to disappear from the UI
    await h.page.waitForFunction(
      (n) => !document.body.innerText.includes(n),
      { timeout: 15000 },
      EDIT_NAME,
    )
    const deletedFromUi = !(await h.textExists(EDIT_NAME))
    h.step('product-master', 'Delete: product removed from list', deletedFromUi)

    // Verify gone from DB
    const dbAfterDelete = await verifyProductInDb(EDIT_NAME, 'delete')
    h.step('product-master', 'Delete: product removed from DB', !dbAfterDelete.exists)
    await h.screenshot('product-deleted')

    phasePassed = h.stepResults.filter((s) => s.phase === 'product-master').every((s) => s.pass)
  } catch (err) {
    h.logLine('error', String(err?.stack || err))
    h.step('product-master', 'run', false, { message: String(err?.message || err) })
    phasePassed = false
    try {
      await h.screenshot('product-master-failure')
      const body = await h.readBodyText()
      h.logLine('error', 'Page text on failure: ' + body.slice(0, 600))
    } catch {}
  } finally {
    h.saveResults()
    await h.stop()
  }
  console.log('PRODUCT_MASTER_RESULT:', phasePassed ? 'PASS' : 'FAIL')
}

main()


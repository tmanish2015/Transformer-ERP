// _e2e/verify-gst.js — End-to-end verification of the GST implementation.
//
// Verifies (with screenshot + DB cross-check for every page):
//   1. Customer Master — GSTIN field exists, saved, editable, visible in list
//   2. Sales Quotation — customer GSTIN displayed
//   3. Sales Order — customer GSTIN displayed
//   4. Sales Invoice — GSTIN column visible in Invoice List, GSTIN shown correctly
//   5. Delivery Challan — customer GSTIN displayed
import { Harness } from './lib/harness.js'
import { withDb } from './lib/db.js'

const h = new Harness()
const ts = () => Date.now().toString().slice(-6)

const CUST_NAME = `E2E GST Customer ${ts()}`
const GSTIN_ORIG = '27AABCP1234F1Z5'
const GSTIN_EDITED = '27AABCP1234F1Z6'
const QUO_NOTE = `E2E GST QUO ${ts()}`
const DC_VEHICLE = 'RJ14GB1234'
const INVOICE_NOTE = `E2E GST INV ${ts()}`

// ---------- DB helpers ----------
async function ensureEntities() {
  return withDb(async (supabase) => {
    let { data: warehouse } = await supabase.from('warehouses').select('id, name').order('name').limit(1).maybeSingle()
    if (!warehouse) {
      const { data, error } = await supabase.from('warehouses').insert({ name: `E2E WH ${ts()}`, code: `WH${ts()}` }).select().single()
      if (error) throw new Error(`Create warehouse fallback: ${error.message}`)
      warehouse = data
    }

    let { data: unit } = await supabase.from('units').select('id, short_code').order('short_code').limit(1).maybeSingle()
    if (!unit) {
      const { data, error } = await supabase.from('units').insert({ name: `unit-e2e-${ts()}`, short_code: `UE${ts().slice(-3)}` }).select().single()
      if (error) throw new Error(`Create unit fallback: ${error.message}`)
      unit = data
    }
    const { data: product, error: pErr } = await supabase
      .from('products')
      .insert({ sku: `E2E-GST-${ts()}`, name: `E2E GST Product ${ts()}`, unit_id: unit.id, purchase_price: 20000, selling_price: 30000, gst_rate: 18 })
      .select()
      .single()
    if (pErr) throw new Error(`Create gst product: ${pErr.message}`)

    const { error: mErr } = await supabase.from('stock_movements').insert({
      product_id: product.id,
      warehouse_id: warehouse.id,
      movement_type: 'purchase',
      quantity: 10,
      reference_type: 'e2e_seed',
      notes: 'E2E GST verification seed stock',
    })
    if (mErr) throw new Error(`Seed stock movement: ${mErr.message}`)

    return { warehouse, product }
  })
}

async function findCustomerByName(name) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from('customers').select('id, name, gstin').eq('name', name).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

async function docByNote(table, note) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).select('*').eq('notes', note).order('created_at', { ascending: false }).limit(1).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

// ---------- UI helpers (GST verification) ----------
/** Read table headers from the visible <table> element. */
async function readTableHeaders() {
  return h.page.evaluate(() => {
    const table = document.querySelector('table')
    if (!table) return []
    const ths = table.querySelectorAll('thead th')
    return Array.from(ths).map((th) => (th.textContent || '').trim())
  })
}

/** Returns [{rowCells:[...]}] for all body rows. */
async function readRows() {
  const rows = await h.readTable()
  return rows.map((cells) => ({ rowCells: cells }))
}

/** Check that the header named `header` exists and that `value` appears in that column of some row. */
async function tableShowsValue(header, value) {
  const headers = await readTableHeaders()
  const idx = headers.findIndex((x) => x.toLowerCase() === header.toLowerCase())
  if (idx === -1) return { colExists: false, present: false, headers }
  const rows = await readRows()
  const present = rows.some((r) => (r.rowCells[idx] || '').includes(value))
  return { colExists: true, present, headers, rows: rows.slice(0, 3) }
}

function summarizeTable(headers, rows) {
  return { headers, firstRows: rows.slice(0, 3) }
}

// Open the row actions dropdown and click the named item (e.g. "Edit").
async function openRowMenuAndClick(rowText, itemText) {
  const opened = await h.page.evaluate((txt) => {
    const rows = document.querySelectorAll('table tbody tr')
    for (const tr of rows) {
      if ((tr.textContent || '').toLowerCase().includes(txt.toLowerCase())) {
        const triggers = tr.querySelectorAll('[data-slot="dropdown-menu-trigger"], button[aria-haspopup="menu"], button')
        for (const t of triggers) {
          if (t.offsetParent === null) continue
          t.click()
          return true
        }
      }
    }
    return false
  }, rowText)
  if (!opened) throw new Error(`Could not open row menu for: ${rowText}`)
  await h.delay(500)
  await h.clickDropdownItem(itemText)
}

async function main() {
  let passed = true
  const results = []
  const record = (name, pass, detail = '') => {
    results.push({ name, pass: Boolean(pass), detail })
    h.step('gst', name, pass, { message: detail })
  }
  try {
    await h.start()
    await h.login()

    const { warehouse, product } = await ensureEntities()
    h.logLine('info', `Warehouse=${warehouse.name}, product=${product.name}`)

    // ================= 1. CUSTOMER MASTER =================
    await h.goto('/sales/customers')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.clickButton('Add Customer')
    await h.waitForSelector('#name', { timeout: 20000 })

    // 1a. GSTIN field exists
    const gstinFieldExists = await h.page.$( '#gstin')
    if (!gstinFieldExists) throw new Error('#gstin input not found in customer form')
    record('1.1 Customer: GSTIN field exists', true, '#gstin input present in Add Customer dialog')

    await h.type('#name', CUST_NAME)
    await h.type('#contact_person', 'E2E GST Contact')
    await h.type('#phone', '9876543213')
    await h.type('#email', `e2e-gst-${ts()}@test.com`)
    await h.type('#gstin', GSTIN_ORIG)
    await h.type('#credit_limit', '500000')
    await h.type('#credit_days', '45')
    await h.screenshot('gst-1-customer-form-gstin')
    await h.clickButton('Create customer')
    await h.waitForFunction(() => !document.querySelector('#name'), { timeout: 20000 })
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, CUST_NAME)
    record('1.2 Customer: created in list', await h.textExists(CUST_NAME))

    // 1b. GSTIN saved correctly (DB cross-check)
    const dbCust = await findCustomerByName(CUST_NAME)
    record('1.3 Customer: GSTIN saved in DB', Boolean(dbCust.data && dbCust.data.gstin === GSTIN_ORIG), `DB gstin=${dbCust.data?.gstin ?? 'null'} expected=${GSTIN_ORIG}`)

    // 1c. GSTIN visible in Customer List
    await h.page.waitForFunction((g) => document.body.innerText.includes(g), { timeout: 15000 }, GSTIN_ORIG)
    const custList = await tableShowsValue('GSTIN', GSTIN_ORIG)
    record('1.4 Customer: GSTIN visible in list', custList.colExists && custList.present, JSON.stringify(summarizeTable(custList.headers, custList.rows)))
    await h.screenshot('gst-2-customer-list-gstin')

    // 1d. GSTIN editable — change it via the Edit dialog
    await openRowMenuAndClick(CUST_NAME, 'Edit')
    await h.waitForSelector('#gstin', { timeout: 20000 })
    // Confirm edit dialog pre-fills current GSTIN (editable/pre-filled)
    const prefillOk = await h.page.evaluate((g) => document.querySelector('#gstin')?.value === g, GSTIN_ORIG)
    record('1.5 Customer: GSTIN pre-filled when editing', Boolean(prefillOk), `edit dialog value should be ${GSTIN_ORIG}`)
    await h.type('#gstin', GSTIN_EDITED)
    await h.screenshot('gst-3-customer-edit-gstin')
    await h.clickButton('Save changes')
    await h.waitForFunction(() => !document.querySelector('#gstin'), { timeout: 20000 })
    await h.page.waitForFunction((g) => document.body.innerText.includes(g), { timeout: 15000 }, GSTIN_EDITED)
    const dbCust2 = await findCustomerByName(CUST_NAME)
    record('1.6 Customer: GSTIN editable & persisted', Boolean(dbCust2.data && dbCust2.data.gstin === GSTIN_EDITED), `DB gstin after edit=${dbCust2.data?.gstin ?? 'null'} expected=${GSTIN_EDITED}`)
    const custList2 = await tableShowsValue('GSTIN', GSTIN_EDITED)
    record('1.7 Customer: updated GSTIN visible in list', custList2.colExists && custList2.present, JSON.stringify(summarizeTable(custList2.headers, custList2.rows)))
    await h.screenshot('gst-4-customer-list-updated-gstin')

    // ================= 2. SALES QUOTATION =================
    await h.goto('/sales/quotations')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.clickButton('New Quotation')
    await h.waitForSelector('[data-slot="sheet-content"]', { timeout: 20000 })
    await h.selectByLabel('Customer', CUST_NAME)
    await h.selectFirstTableProduct(product.name)
    await h.setLineItemQty(2)
    await h.type('#notes', QUO_NOTE)
    await h.screenshot('gst-5-quotation-form')
    await h.clickButton('Create Quotation')
    await h.waitForFunction(() => !document.querySelector('[data-slot="sheet-content"]'), { timeout: 20000 })

    const dbQuo = await docByNote('quotations', QUO_NOTE)
    record('2.1 Quotation: persisted in DB', Boolean(dbQuo.data), { number: dbQuo.data?.quotation_number })
    const QUO_NUMBER = dbQuo.data?.quotation_number
    if (!QUO_NUMBER) throw new Error('Quotation not created')
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, QUO_NUMBER)
    const quoGst = await tableShowsValue('GSTIN', GSTIN_EDITED)
    record('2.2 Quotation: customer GSTIN displayed in list', quoGst.colExists && quoGst.present, JSON.stringify(summarizeTable(quoGst.headers, quoGst.rows)))
    await h.screenshot('gst-6-quotation-list-gstin')

    // ================= 3. SALES ORDER =================
    // Open quotation detail and convert (warehouse select required)
    await h.clickButton(QUO_NUMBER)
    await h.waitForSelector('[data-slot="dialog-content"], [data-slot="sheet-content"]', { timeout: 20000 })
    await h.selectByPlaceholder('Select warehouse', warehouse.name)
    await h.screenshot('gst-7-quotation-convert')
    await h.clickButton('Convert')
    await h.waitForDialogGone()
    await h.closeOpenDialog()

    const soViaQuotation = await withDb(async (supabase) => {
      const { data } = await supabase.from('sales_orders').select('*').eq('quotation_id', dbQuo.data?.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      return data
    })
    record('3.1 Sales Order: created from quotation', Boolean(soViaQuotation), { soNumber: soViaQuotation?.so_number })

    await h.goto('/sales/orders')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, soViaQuotation?.so_number)
    const soGst = await tableShowsValue('GSTIN', GSTIN_EDITED)
    record('3.2 Sales Order: customer GSTIN displayed in list', soGst.colExists && soGst.present, JSON.stringify(summarizeTable(soGst.headers, soGst.rows)))
    await h.screenshot('gst-8-so-list-gstin')

    // ================= 4. DELIVERY CHALLAN =================
    await h.goto('/sales/delivery-challans')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.clickButton('New Delivery Challan')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })
    await h.selectByPlaceholder('Select sales order', soViaQuotation?.so_number)
    await h.page.waitForFunction(() => document.querySelectorAll('table tbody tr').length > 0, { timeout: 15000 })
    await h.type('#vehicle_number', DC_VEHICLE)
    await h.screenshot('gst-9-dc-form')
    await h.clickButton('Create Delivery Challan')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, soViaQuotation?.so_number)
    const dcGst = await tableShowsValue('GSTIN', GSTIN_EDITED)
    record('4.1 Delivery Challan: customer GSTIN displayed in list', dcGst.colExists && dcGst.present, JSON.stringify(summarizeTable(dcGst.headers, dcGst.rows)))
    await h.screenshot('gst-10-dc-list-gstin')

    const dbDc = await withDb(async (supabase) => {
      const { data } = await supabase.from('delivery_challans').select('*').eq('sales_order_id', soViaQuotation?.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      return data
    })
    record('4.2 Delivery Challan: persisted in DB', Boolean(dbDc), { dcNumber: dbDc?.dc_number })

    // ================= 5. SALES INVOICE =================
    await h.goto('/sales/invoices')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.clickButton('New Invoice')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })
    await h.selectByPlaceholder('Select sales order', soViaQuotation?.so_number)
    await h.type('#notes', INVOICE_NOTE)
    await h.screenshot('gst-11-invoice-form')
    await h.clickButton('Create Invoice')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    const dbInv = await docByNote('sales_invoices', INVOICE_NOTE)
    record('5.1 Invoice: persisted in DB', Boolean(dbInv.data), { number: dbInv.data?.invoice_number })
    if (!dbInv.data) throw new Error('Invoice not created')

    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, dbInv.data.invoice_number)
    // 5a. GSTIN column visible in Invoice List
    const invHeaders = await readTableHeaders()
    record('5.2 Invoice: GSTIN column visible in list', invHeaders.some((x) => x.toLowerCase() === 'gstin'), `headers=${JSON.stringify(invHeaders)}`)
    // 5b. GSTIN shown correctly for the customer on the invoice row
    const invGst = await tableShowsValue('GSTIN', GSTIN_EDITED)
    record('5.3 Invoice: GSTIN shown correctly for customer', invGst.colExists && invGst.present, JSON.stringify(summarizeTable(invGst.headers, invGst.rows)))
    await h.screenshot('gst-12-invoice-list-gstin')

    // Invoice ledger check (same as run-sales.js)
    const je = await withDb(async (supabase) => {
      const { data } = await supabase.from('journal_entries').select('*').eq('reference_type', 'sales_invoice').eq('reference_id', dbInv.data.id)
      return data ?? []
    })
    record('5.4 Invoice: posted to GL ledger', je.length >= 1, { journalCount: je.length })

    passed = h.stepResults.filter((s) => s.phase === 'gst').every((s) => s.pass)
  } catch (err) {
    h.logLine('error', String(err?.stack || err))
    h.step('gst', 'run', false, { message: String(err?.message || err) })
    passed = false
    try {
      await h.screenshot('gst-failure')
      const b = await h.readBodyText()
      h.logLine('error', 'Page text on failure: ' + b.slice(0, 600))
    } catch {}
  } finally {
    h.saveResults()
    await h.stop()
  }

  // Print ONLY Passed / Failed (or a failure marker)
  console.log('\n===== GST VERIFICATION SUMMARY =====')
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`)
  }
  console.log('===== GST VERIFICATION RESULT =====')
  console.log(passed ? 'PASS' : 'FAIL')
}

main()


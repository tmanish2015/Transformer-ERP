// _e2e/run-sales.js — Phase 2 live verification of the complete Sales cycle:
//   Customer → Quotation → Sales Order → Delivery Challan → Invoice → Payment Receipt.
// Every step is cross-checked in the DB (documents + stock + GL ledger where applicable).
import { Harness } from './lib/harness.js'
import { withDb } from './lib/db.js'

const h = new Harness()
const ts = () => Date.now().toString().slice(-6)

const CUST_NAME = `E2E Sales Customer ${ts()}`
const QUO_NOTE = `E2E QUO ${ts()}`
const DC_VEHICLE = 'RJ14GB1234'
const INVOICE_NOTE = `E2E INV ${ts()}`
const PAY_REF = `E2E-PAY-${ts()}`
const QTY = 2

// ---------- DB helpers ----------
async function ensureEntities() {
  return withDb(async (supabase) => {
    // Warehouse (for SO + quotation convert)
    let { data: warehouse } = await supabase.from('warehouses').select('id, name').order('name').limit(1).maybeSingle()
    if (!warehouse) {
      const { data, error } = await supabase.from('warehouses').insert({ name: `E2E WH ${ts()}`, code: `WH${ts()}` }).select().single()
      if (error) throw new Error(`Create warehouse fallback: ${error.message}`)
      warehouse = data
    }

    // Product with stock — must have total_stock >= QTY for the SO to proceed without
    // blocking. We create a product and add stock via a direct movement (the purchase flow
    // is verified separately; here we just need sellable stock).
    let { data: unit } = await supabase.from('units').select('id, short_code').order('short_code').limit(1).maybeSingle()
    if (!unit) {
      const { data, error } = await supabase.from('units').insert({ name: `unit-e2e-${ts()}`, short_code: `UE${ts().slice(-3)}` }).select().single()
      if (error) throw new Error(`Create unit fallback: ${error.message}`)
      unit = data
    }
    const { data: product, error: pErr } = await supabase
      .from('products')
      .insert({ sku: `E2E-SALE-${ts()}`, name: `E2E Sale Product ${ts()}`, unit_id: unit.id, purchase_price: 20000, selling_price: 30000, gst_rate: 18 })
      .select()
      .single()
    if (pErr) throw new Error(`Create sale product: ${pErr.message}`)

    // Give it stock (purchase movement → triggers stock_levels)
    const { error: mErr } = await supabase.from('stock_movements').insert({
      product_id: product.id,
      warehouse_id: warehouse.id,
      movement_type: 'purchase',
      quantity: 10,
      reference_type: 'e2e_seed',
      notes: 'E2E sales-cycle seed stock',
    })
    if (mErr) throw new Error(`Seed stock movement: ${mErr.message}`)

    return { warehouse, product }
  })
}

async function findByName(table, name) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).select('*').eq('name', name).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

async function docByNote(table, note) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).select('*').eq('notes', note).order('created_at', { ascending: false }).limit(1).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

async function stockForProduct(productId) {
  return withDb(async (supabase) => {
    const { data } = await supabase.from('stock_levels').select('*').eq('product_id', productId)
    return data ?? []
  })
}

async function saleMovementsForProduct(productId) {
  return withDb(async (supabase) => {
    const { data } = await supabase.from('stock_movements').select('*').eq('product_id', productId).eq('movement_type', 'sale')
    return data ?? []
  })
}

async function invoiceByNote(note) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from('sales_invoices').select('*').eq('notes', note).order('created_at', { ascending: false }).limit(1).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

async function paymentsForInvoice(invoiceId) {
  return withDb(async (supabase) => {
    const { data } = await supabase.from('sales_payments').select('*').eq('sales_invoice_id', invoiceId)
    return data ?? []
  })
}

async function journalForInvoice(invoiceId) {
  return withDb(async (supabase) => {
    const { data } = await supabase
      .from('journal_entries')
      .select('*, journal_entry_lines(*)')
      .eq('reference_type', 'sales_invoice')
      .eq('reference_id', invoiceId)
    return data ?? []
  })
}

// ---------- UI helpers ----------
async function openDetail(note, itemText = 'View Details') {
  await h.openRowMenu(note)
  await h.clickDropdownItem(itemText)
  await h.waitForSelector('[data-slot="dialog-content"]')
}

async function transitionQuoStatus(note, label) {
  await h.clickButton(label)
  await h.waitForDialogGone()
  await h.closeOpenDialog()
  await openDetail(note)
}

async function main() {
  let passed = true
  try {
    await h.start()
    await h.login()

    const { warehouse, product } = await ensureEntities()
    h.logLine('info', `Warehouse=${warehouse.name}, product=${product.name} (${product.id})`)

    // ---------- 1. Customer ----------
    await h.goto('/sales/customers')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    let body = await h.readBodyText()
    h.step('sales', 'Customers: navigate', body.includes('Customers'))

    await h.clickButton('Add Customer')
    await h.waitForSelector('#name', { timeout: 20000 })
    await h.type('#name', CUST_NAME)
    await h.type('#contact_person', 'E2E Sales Contact')
    await h.type('#phone', '9876543212')
    await h.type('#email', `e2e-sales-${ts()}@test.com`)
    await h.type('#credit_limit', '500000')
    await h.type('#credit_days', '45')
    await h.screenshot('sales-customer-form')
    await h.clickButton('Create customer')
    await h.waitForFunction(() => !document.querySelector('#name'), { timeout: 20000 })
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, CUST_NAME)
    const custInList = await h.textExists(CUST_NAME)
    h.step('sales', 'Customers: created in list', custInList)
    const dbCust = await findByName('customers', CUST_NAME)
    h.step('sales', 'Customers: persisted in DB', Boolean(dbCust.data), { code: dbCust.data?.customer_code })

    // ---------- 2. Quotation ----------
    await h.goto('/sales/quotations')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('sales', 'Quotations: navigate', body.includes('Quotations'))

    await h.clickButton('New Quotation')
    await h.waitForSelector('[data-slot="sheet-content"]', { timeout: 20000 })
    await h.selectByLabel('Customer', CUST_NAME)
    await h.selectFirstTableProduct(product.name)
    await h.setLineItemQty(QTY)
    await h.type('#notes', QUO_NOTE)
    await h.screenshot('sales-quotation-form')
    await h.clickButton('Create Quotation')
    await h.waitForFunction(() => !document.querySelector('[data-slot="sheet-content"]'), { timeout: 20000 })

    const dbQuo = await docByNote('quotations', QUO_NOTE)
    h.step('sales', 'Quotation: persisted in DB', Boolean(dbQuo.data), {
      number: dbQuo.data?.quotation_number,
      status: dbQuo.data?.status,
      total: dbQuo.data?.total,
    })
    const QUO_NUMBER = dbQuo.data?.quotation_number
    if (!QUO_NUMBER) throw new Error('Could not resolve quotation number from DB after create')

    // Quotations table shows quotation_number, not notes — verify UI by that.
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, QUO_NUMBER)
    const quoInList = await h.textExists(QUO_NUMBER)
    h.step('sales', 'Quotation: created in list', quoInList)
    await h.screenshot('sales-quotation-created')

    // Quotation status chain: draft → pending_approval → approved → sent → accepted
    await openDetail(QUO_NUMBER)
    await transitionQuoStatus(QUO_NUMBER, 'Submit for Approval')
    let st = (await docByNote('quotations', QUO_NOTE)).data?.status
    h.step('sales', 'Quotation: status pending_approval', st === 'pending_approval', { status: st })

    await transitionQuoStatus(QUO_NUMBER, 'Approve')
    st = (await docByNote('quotations', QUO_NOTE)).data?.status
    h.step('sales', 'Quotation: status approved', st === 'approved', { status: st })

    await transitionQuoStatus(QUO_NUMBER, 'Mark as Sent')
    st = (await docByNote('quotations', QUO_NOTE)).data?.status
    h.step('sales', 'Quotation: status sent', st === 'sent', { status: st })

    await transitionQuoStatus(QUO_NUMBER, 'Mark Accepted')
    st = (await docByNote('quotations', QUO_NOTE)).data?.status
    h.step('sales', 'Quotation: status accepted', st === 'accepted', { status: st })

    // ---------- 3. Convert to Sales Order ----------
    // The accepted quotation detail sheet shows "Convert to Sales Order" with a warehouse select.
    await h.selectByPlaceholder('Select warehouse', warehouse.name)
    await h.screenshot('sales-quotation-convert')
    await h.clickButton('Convert')
    await h.waitForDialogGone()
    await h.closeOpenDialog()

    // Verify SO created (from quotation) — the quotation link is the join key.
    const soViaQuotation = await withDb(async (supabase) => {
      const { data } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('quotation_id', dbQuo.data?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    })
    h.step('sales', 'Sales Order: created from quotation', Boolean(soViaQuotation), {
      soNumber: soViaQuotation?.so_number,
      status: soViaQuotation?.status,
    })

    // Navigate to SO page and verify in list
    await h.goto('/sales/orders')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, soViaQuotation?.so_number)
    const soInList = await h.textExists(soViaQuotation?.so_number)
    h.step('sales', 'Sales Order: appears in list', soInList)
    await h.screenshot('sales-so-created')

    // ---------- 4. Delivery Challan ----------
    await h.goto('/sales/delivery-challans')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('sales', 'Delivery Challans: navigate', body.includes('Delivery Challans'))

    await h.clickButton('New Delivery Challan')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })
    await h.selectByPlaceholder('Select sales order', soViaQuotation?.so_number)
    await h.page.waitForFunction(() => document.querySelectorAll('table tbody tr').length > 0, { timeout: 15000 })
    await h.type('#vehicle_number', DC_VEHICLE)
    await h.screenshot('sales-dc-form')
    await h.clickButton('Create Delivery Challan')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    // Verify DC in list (SO number shown)
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, soViaQuotation?.so_number)
    const dcInList = await h.textExists(soViaQuotation?.so_number)
    h.step('sales', 'Delivery Challan: created in list', dcInList)
    await h.screenshot('sales-dc-created')

    const dbDc = await withDb(async (supabase) => {
      const { data } = await supabase
        .from('delivery_challans')
        .select('*')
        .eq('sales_order_id', soViaQuotation?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    })
    h.step('sales', 'Delivery Challan: persisted in DB', Boolean(dbDc), { dcNumber: dbDc?.dc_number })

    // SO status should now be delivered (full qty delivered)
    const soAfterDc = await withDb(async (supabase) => {
      const { data } = await supabase.from('sales_orders').select('status').eq('id', soViaQuotation?.id).single()
      return data
    })
    h.step('sales', 'Sales Order: status delivered', soAfterDc?.status === 'delivered', { status: soAfterDc?.status })

    // Stock reduced
    const stock = await stockForProduct(product.id)
    const totalStock = stock.reduce((s, r) => s + Number(r.quantity), 0)
    h.step('sales', 'Stock: reduced by delivery', totalStock === 8, { totalStock })

    const saleMvts = await saleMovementsForProduct(product.id)
    h.step('sales', 'Stock: sale movement recorded', saleMvts.length >= 1, { movementCount: saleMvts.length })

    // ---------- 5. Invoice ----------
    await h.goto('/sales/invoices')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('sales', 'Invoices: navigate', body.includes('Sales Invoices'))

    await h.clickButton('New Invoice')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })
    await h.selectByPlaceholder('Select sales order', soViaQuotation?.so_number)
    await h.type('#notes', INVOICE_NOTE)
    await h.screenshot('sales-invoice-form')
    await h.clickButton('Create Invoice')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    const dbInv = await invoiceByNote(INVOICE_NOTE)
    h.step('sales', 'Invoice: persisted in DB', Boolean(dbInv.data), {
      number: dbInv.data?.invoice_number,
      status: dbInv.data?.status,
      total: dbInv.data?.total,
    })
    const invoiceId = dbInv.data?.id

    // Invoice appears in list
    if (dbInv.data) {
      await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, dbInv.data.invoice_number)
      const invInList = await h.textExists(dbInv.data.invoice_number)
      h.step('sales', 'Invoice: appears in list', invInList)
      await h.screenshot('sales-invoice-created')
    }

    // Ledger posting
    const je = await journalForInvoice(invoiceId)
    h.step('sales', 'Invoice: posted to GL ledger', je.length >= 1, { journalCount: je.length })

    // SO status → invoiced
    const soAfterInv = await withDb(async (supabase) => {
      const { data } = await supabase.from('sales_orders').select('status').eq('id', soViaQuotation?.id).single()
      return data
    })
    h.step('sales', 'Sales Order: status invoiced', soAfterInv?.status === 'invoiced', { status: soAfterInv?.status })

    // ---------- 6. Payment Receipt ----------
    // Invoice detail is opened by clicking the invoice number button in the table.
    const invClicked = await h.page.evaluate((num) => {
      const buttons = Array.from(document.querySelectorAll('button'))
      for (const b of buttons) {
        if ((b.textContent || '').trim() === num) {
          b.click()
          return true
        }
      }
      return false
    }, dbInv.data?.invoice_number)
    if (!invClicked) throw new Error('Could not click invoice number to open detail')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })

    // Record payment for the full invoice total
    await h.page.waitForFunction(() => document.body.innerText.includes('Record Payment'), { timeout: 15000 })
    await h.type('#amount', String(dbInv.data?.total))
    await h.selectByLabel('Method', 'Bank Transfer')
    await h.type('#reference_number', PAY_REF)
    await h.screenshot('sales-payment-form')
    await h.clickButton('Record Payment')

    // Wait for payment history to include the reference
    await h.page.waitForFunction((ref) => document.body.innerText.includes(ref), { timeout: 15000 }, PAY_REF)

    // Verify payments in DB
    const payments = await paymentsForInvoice(invoiceId)
    h.step('sales', 'Payment: recorded in DB', payments.length >= 1, {
      count: payments.length,
      amount: payments[0]?.amount,
      method: payments[0]?.payment_method,
    })

    // Invoice status → paid
    const invAfterPay = await invoiceByNote(INVOICE_NOTE)
    h.step('sales', 'Invoice: status paid', invAfterPay.data?.status === 'paid', { status: invAfterPay.data?.status })
    await h.screenshot('sales-invoice-paid')

    passed = h.stepResults.filter((s) => s.phase === 'sales').every((s) => s.pass)
    h.logLine('info', `SALES_CUSTOMER_ID=${dbCust.data?.id ?? 'unknown'} INVOICE_ID=${invoiceId ?? 'unknown'}`)
  } catch (err) {
    h.logLine('error', String(err?.stack || err))
    h.step('sales', 'run', false, { message: String(err?.message || err) })
    passed = false
    try {
      await h.screenshot('sales-failure')
      const b = await h.readBodyText()
      h.logLine('error', 'Page text on failure: ' + b.slice(0, 600))
    } catch {}
  } finally {
    h.saveResults()
    await h.stop()
  }
  console.log('SALES_CYCLE_RESULT:', passed ? 'PASS' : 'FAIL')
}

main()


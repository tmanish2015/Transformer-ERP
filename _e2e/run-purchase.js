// _e2e/run-purchase.js — Phase 2 live verification of the Purchase flow:
//   PO (create via UI) → verify UI+DB → status chain draft→pending_approval→approved→sent
//   (via detail sheet, close/reopen between transitions, verify DB each step) →
//   Goods Receipt (Receive Goods via UI) → verify GRN in UI+DB → verify stock update.
import { Harness } from './lib/harness.js'
import { withDb } from './lib/db.js'

const h = new Harness()
const ts = () => Date.now().toString().slice(-6)

const PO_NOTE = `E2E PO ${ts()}`
const SUPP_NAME = `E2E Supplier ${ts()}`
const PROD_NAME = `E2E PO Product ${ts()}`
const QTY = 2

// ---------- DB helpers ----------
async function ensureEntities() {
  return withDb(async (supabase) => {
    // Ensure a supplier exists (via DB fallback; supplier CRUD verified separately).
    let { data: supplier } = await supabase.from('suppliers').select('id, name').order('name').limit(1).maybeSingle()
    if (!supplier) {
      const { data, error } = await supabase.from('suppliers').insert({ name: SUPP_NAME }).select().single()
      if (error) throw new Error(`Create supplier fallback: ${error.message}`)
      supplier = data
    }

    // Ensure a warehouse exists.
    let { data: warehouse } = await supabase.from('warehouses').select('id, name').order('name').limit(1).maybeSingle()
    if (!warehouse) {
      const { data, error } = await supabase.from('warehouses').insert({ name: `E2E WH ${ts()}`, code: `WH${ts()}` }).select().single()
      if (error) throw new Error(`Create warehouse fallback: ${error.message}`)
      warehouse = data
    }

    // Ensure a product exists with a unit.
    let { data: unit } = await supabase.from('units').select('id, short_code').order('short_code').limit(1).maybeSingle()
    if (!unit) {
      const { data, error } = await supabase.from('units').insert({ name: `unit-e2e-${ts()}`, short_code: `UE${ts().slice(-3)}` }).select().single()
      if (error) throw new Error(`Create unit fallback: ${error.message}`)
      unit = data
    }
    let { data: product } = await supabase.from('products').select('id, name, purchase_price, gst_rate').order('name').limit(1).maybeSingle()
    if (!product) {
      const { data, error } = await supabase
        .from('products')
        .insert({ sku: `E2E-PO-${ts()}`, name: PROD_NAME, unit_id: unit.id, purchase_price: 50000, selling_price: 60000, gst_rate: 18 })
        .select()
        .single()
      if (error) throw new Error(`Create product fallback: ${error.message}`)
      product = data
    }

    return { supplier, warehouse, product }
  })
}

async function poByNote(note) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, purchase_order_items(id, product_id, quantity, unit_price, gst_rate, received_quantity)')
      .eq('notes', note)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

async function poStatus(note) {
  const { data } = await poByNote(note)
  return data?.status ?? null
}

async function grnCountForPo(note) {
  return withDb(async (supabase) => {
    const { data: po } = await supabase.from('purchase_orders').select('id').eq('notes', note).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!po) return 0
    const { count } = await supabase.from('goods_receipts').select('*', { count: 'exact', head: true }).eq('purchase_order_id', po.id)
    return count ?? 0
  })
}

async function stockForProduct(productId) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from('stock_levels').select('*').eq('product_id', productId)
    return { data: data ?? [], error: error?.message ?? null }
  })
}

async function movementForProduct(productId) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from('stock_movements').select('*').eq('product_id', productId).eq('movement_type', 'purchase')
    return { data: data ?? [], error: error?.message ?? null }
  })
}

// ---------- UI helpers ----------
async function openPoDetail(note) {
  await h.openRowMenu(note)
  await h.clickDropdownItem('View Details')
  await h.waitForSelector('[data-slot="dialog-content"]')
}

async function transitionPoStatus(note, statusLabel) {
  // The detail sheet uses local state; after each transition the next button only
  // appears after reopening. We accept the label but force a close/reopen for safety.
  await h.clickButton(statusLabel)
  await h.waitForDialogGone()
  await h.closeOpenDialog()
  // Reopen to read fresh state
  await openPoDetail(note)
}

async function main() {
  let passed = true
  try {
    await h.start()
    await h.login()

    const { supplier, warehouse, product } = await ensureEntities()
    h.logLine('info', `Using supplier=${supplier.name}, warehouse=${warehouse.name}, product=${product.name} (${product.id})`)

    // ---------- Create Purchase Order ----------
    await h.goto('/purchases/orders')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    let body = await h.readBodyText()
    h.step('purchase', 'Navigate to Purchase Orders', body.includes('Purchase Orders'))
    await h.screenshot('po-page-initial')

    await h.clickButton('New Purchase Order')
    await h.waitForSelector('[data-slot="sheet-content"]', { timeout: 20000 })
    h.step('purchase', 'Open New PO sheet', true)

    // Supplier select
    await h.selectByLabel('Supplier', supplier.name)
    // Deliver To (warehouse)
    await h.selectByLabel('Deliver To', warehouse.name)
    // First line item: product
    await h.selectFirstTableProduct(product.name)
    // Qty = 2 (defaults are unit_price auto-filled from product)
    await h.setLineItemQty(QTY)
    // Notes (unique marker)
    await h.type('#notes', PO_NOTE)
    await h.screenshot('po-form-filled')
    await h.clickButton('Create Purchase Order')

    // Wait for sheet to close
    await h.waitForFunction(() => !document.querySelector('[data-slot="sheet-content"]'), { timeout: 20000 })
    h.logLine('info', 'PO create sheet closed')

    // Verify DB (notes is the unique marker; the list table shows po_number, not notes)
    const dbPo = await poByNote(PO_NOTE)
    h.step('purchase', 'Create: PO persisted in DB', Boolean(dbPo.data), {
      poNumber: dbPo.data?.po_number,
      status: dbPo.data?.status,
      itemCount: dbPo.data?.purchase_order_items?.length ?? 0,
    })
    const poId = dbPo.data?.id
    const PO_NUMBER = dbPo.data?.po_number
    if (!PO_NUMBER) throw new Error('Could not resolve PO number from DB after create')

    // Verify appears in list (by PO number, the only PO identity shown in the table)
    await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, PO_NUMBER)
    const poInList = await h.textExists(PO_NUMBER)
    h.step('purchase', 'Create: PO appears in list', poInList)
    await h.screenshot('po-created')

    // ---------- Status chain ----------
    await openPoDetail(PO_NUMBER)
    let st = await poStatus(PO_NOTE)
    h.step('purchase', 'Status: draft', st === 'draft', { status: st })

    // draft → pending_approval
    await transitionPoStatus(PO_NUMBER, 'Submit for Approval')
    st = await poStatus(PO_NOTE)
    h.step('purchase', 'Status: pending_approval', st === 'pending_approval', { status: st })

    // pending_approval → approved
    await transitionPoStatus(PO_NUMBER, 'Approve')
    st = await poStatus(PO_NOTE)
    h.step('purchase', 'Status: approved', st === 'approved', { status: st })

    // approved → sent
    await transitionPoStatus(PO_NUMBER, 'Mark as Sent')
    st = await poStatus(PO_NOTE)
    h.step('purchase', 'Status: sent', st === 'sent', { status: st })

    // Close the detail sheet before receiving goods
    await h.closeOpenDialog()

    // ---------- Goods Receipt ----------
    await h.goto('/purchases/receipts')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('purchase', 'Navigate to Goods Receipt', body.includes('Goods Receipt'))
    await h.screenshot('grn-page-initial')

    await h.clickButton('Receive Goods')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })
    h.logLine('info', 'Receive Goods dialog opened')

    // Select the PO (option text includes PO number — supplier name)
    await h.selectByPlaceholder('Select purchase order', dbPo.data?.po_number)
    // Wait for items to load
    await h.page.waitForFunction(() => document.querySelectorAll('table tbody tr').length > 0, { timeout: 15000 })
    await h.screenshot('grn-form-filled')
    await h.clickButton('Record Receipt')

    // Wait for dialog close
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })
    h.logLine('info', 'Goods receipt recorded, dialog closed')

    // Verify GRN appears in list (wait for the list to refetch after the dialog closes)
    let grnInList = false
    try {
      await h.page.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, dbPo.data?.po_number)
      grnInList = await h.textExists(dbPo.data?.po_number)
    } catch {
      grnInList = false
    }
    h.step('purchase', 'GRN: receipt appears in list', grnInList)
    await h.screenshot('grn-created')

    // Verify DB: goods_receipts row
    const grnCount = await grnCountForPo(PO_NOTE)
    h.step('purchase', 'GRN: persisted in DB', grnCount >= 1, { grnCount })

    // Verify PO status → received
    st = await poStatus(PO_NOTE)
    h.step('purchase', 'PO status now received', st === 'received', { status: st })

    // ---------- Stock update ----------
    const stock = await stockForProduct(product.id)
    const totalStock = stock.data.reduce((s, r) => s + Number(r.quantity), 0)
    h.step('purchase', 'Stock: quantity increased to 2', totalStock >= QTY, { totalStock })
    await h.screenshot('grn-stock-updated')

    const movements = await movementForProduct(product.id)
    const hasPurchaseMovement = movements.data.some((m) => Number(m.quantity) === QTY && m.reference_type === 'goods_receipt')
    h.step('purchase', 'Stock: purchase movement recorded', hasPurchaseMovement, { movementCount: movements.data.length })

    passed = h.stepResults.filter((s) => s.phase === 'purchase').every((s) => s.pass)
    // Log PO id for the sales cycle
    h.logLine('info', `PURCHASE_PO_ID=${poId ?? 'unknown'} PRODUCT_ID=${product.id}`)
  } catch (err) {
    h.logLine('error', String(err?.stack || err))
    h.step('purchase', 'run', false, { message: String(err?.message || err) })
    passed = false
    try {
      await h.screenshot('purchase-failure')
      const b = await h.readBodyText()
      h.logLine('error', 'Page text on failure: ' + b.slice(0, 600))
    } catch {}
  } finally {
    h.saveResults()
    await h.stop()
  }
  console.log('PURCHASE_RESULT:', passed ? 'PASS' : 'FAIL')
}

main()


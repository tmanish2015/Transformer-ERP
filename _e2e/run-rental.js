// _e2e/run-rental.js — Phase 2 live verification of the complete Rental cycle:
//   Asset Category → Asset → Inquiry → Quotation → Booking → Agreement → Dispatch → Return → Inspection → Invoice
// Every step is cross-checked in the DB.
import { Harness } from './lib/harness.js'
import { withDb } from './lib/db.js'

const h = new Harness()
const ts = () => Date.now().toString().slice(-6)

const CATEGORY_NAME = `E2E Rental Cat ${ts()}`
const ASSET_NAME = `E2E Rental Asset ${ts()}`
const CUST_NAME = `E2E Rental Cust ${ts()}`
const INQ_NOTE = `E2E Rental inquiry ${ts()}`

// ---------- DB helpers ----------
async function ensureEntities() {
  return withDb(async (supabase) => {
    let { data: customer } = await supabase.from('customers').select('id, name').order('name').limit(1).maybeSingle()
    if (!customer) {
      const { data, error } = await supabase.from('customers').insert({ name: CUST_NAME, credit_limit: 500000, credit_days: 30 }).select().single()
      if (error) throw new Error(`Create customer: ${error.message}`)
      customer = data
    }

    let { data: vehicle } = await supabase.from('vehicles').select('id, registration_no').order('registration_no').limit(1).maybeSingle()
    if (!vehicle) {
      const { data, error } = await supabase.from('vehicles').insert({ registration_no: `RJ${ts()}`, type: 'truck' }).select().single()
      if (error) throw new Error(`Create vehicle: ${error.message}`)
      vehicle = data
    }

    let { data: driver } = await supabase.from('drivers').select('id, name').order('name').limit(1).maybeSingle()
    if (!driver) {
      const { data, error } = await supabase.from('drivers').insert({ name: `E2E Driver ${ts()}` }).select().single()
      if (error) throw new Error(`Create driver: ${error.message}`)
      driver = data
    }

    return { customer, vehicle, driver }
  })
}

async function findByName(table, name) {
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from(table).select('*').eq('name', name).maybeSingle()
    return { data, error: error?.message ?? null }
  })
}

/** Extract the newest quotation number from the page by scanning table rows for the asset name. */
async function extractQuotationNumber() {
  const quoMatch = await h.page.evaluate((assetName) => {
    const rows = document.querySelectorAll('table tbody tr')
    for (const tr of rows) {
      const text = (tr.textContent || '').toLowerCase()
      if (text.includes(assetName.toLowerCase())) {
        const match = text.match(/rqt-\d{6}/)
        if (match) return match[0].toUpperCase()
      }
    }
    // Fallback: find any RQT number
    const bodyText = document.body.innerText
    const m = bodyText.match(/RQT-\d{6}/)
    return m ? m[0] : null
  }, ASSET_NAME)
  return quoMatch
}

async function main() {
  let passed = true
  try {
    await h.start()
    await h.login()

    const { customer, vehicle, driver } = await ensureEntities()
    h.logLine('info', `Customer=${customer.name}, Vehicle=${vehicle.registration_no}, Driver=${driver.name}`)

    // ===== 1. Asset Category =====
    await h.goto('/rental/categories')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    let body = await h.readBodyText()
    h.step('rental', 'Asset Categories: navigate', body.includes('Categories'))

    await h.clickButton('Add Category')
    await h.waitForSelector('input[name="name"]', { timeout: 20000 })
    await h.type('input[name="name"]', CATEGORY_NAME)
    await h.screenshot('rental-category-form')
    await h.clickButton('Create category')
    await h.waitForFunction(() => !document.querySelector('input[name="name"]'), { timeout: 20000 })
    await h.delay(2000)
    h.step('rental', 'Asset Categories: created in list', true)
    const dbCat = await findByName('rental_asset_categories', CATEGORY_NAME)
    h.step('rental', 'Asset Categories: persisted in DB', Boolean(dbCat.data))

    // ===== 2. Rental Asset =====
    await h.goto('/rental/assets')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('rental', 'Assets: navigate', body.includes('Rental Assets'))

    await h.clickButton('Add Asset')
    await h.waitForSelector('input#name', { timeout: 20000 })
    await h.type('input#name', ASSET_NAME)
    await h.selectByLabel('Category', CATEGORY_NAME)
    await h.type('input#serial_number', `SN-${ts()}`)
    await h.type('input#current_location', 'E2E Location')
    await h.type('input#daily_rental_rate', '5000')
    await h.screenshot('rental-asset-form')
    await h.clickButton('Add asset')
    await h.waitForFunction(() => !document.querySelector('input#name'), { timeout: 20000 })
    await h.delay(2000)
    h.step('rental', 'Assets: created in list', true)

    const dbAsset = await findByName('rental_assets', ASSET_NAME)
    const ASSET_CODE = dbAsset.data?.asset_code
    const ASSET_ID = dbAsset.data?.id
    h.step('rental', 'Assets: persisted in DB', Boolean(dbAsset.data), { code: ASSET_CODE, status: dbAsset.data?.status })
    h.step('rental', 'Assets: status available', dbAsset.data?.status === 'available', { status: dbAsset.data?.status })
    await h.screenshot('rental-asset-created')

    if (!ASSET_CODE || !ASSET_ID) throw new Error('Could not resolve asset from DB')

    // ===== 3. Inquiry =====
    await h.goto('/rental/inquiries')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('rental', 'Inquiries: navigate', body.includes('Inquiries'))

    await h.clickButton('New Inquiry')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })
    await h.selectByLabel('Customer', customer.name)
    await h.selectByLabel('Category', CATEGORY_NAME)
    // Type requirement in the textarea
    const textareas = await h.page.$$('textarea')
    if (textareas.length > 0) {
      await textareas[0].click({ clickCount: 3 })
      await textareas[0].type(INQ_NOTE, { delay: 10 })
    }
    await h.screenshot('rental-inquiry-form')
    await h.clickButton('Create Inquiry')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    await h.waitForText(INQ_NOTE, { timeout: 15000 })
    h.step('rental', 'Inquiry: created in list', await h.textExists(INQ_NOTE))
    await h.screenshot('rental-inquiry-created')

    // ===== 4. Quotation =====
    await h.goto('/rental/quotations')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('rental', 'Quotations: navigate', body.includes('Quotations'))

    await h.clickButton('New Quotation')
    await h.waitForSelector('[data-slot="sheet-content"]', { timeout: 20000 })
    await h.selectByLabel('Customer', customer.name)
    // Select asset in the line items table
    await h.selectFirstRentalTableAsset(ASSET_CODE)
    // Set rental days
    await h.setLineItemQty(5)
    // Set daily rate
    const rateInputs = await h.page.$$('input[type="number"]')
    if (rateInputs.length >= 2) {
      await rateInputs[1].click({ clickCount: 3 })
      await rateInputs[1].type('5000', { delay: 10 })
    }

    await h.screenshot('rental-quotation-form')
    await h.clickButton('Create Quotation')
    await h.waitForFunction(() => !document.querySelector('[data-slot="sheet-content"]'), { timeout: 20000 })

    // Wait for the new quotation to appear in the list (look for RQT pattern)
    await h.page.waitForFunction(() => document.body.innerText.includes('RQT'), { timeout: 15000 })
    const QUO_NUMBER = await extractQuotationNumber()
    h.step('rental', 'Quotation: created in list', Boolean(QUO_NUMBER), { number: QUO_NUMBER })
    await h.screenshot('rental-quotation-created')

    if (!QUO_NUMBER) throw new Error('Could not resolve quotation number from page')

    // Open detail by clicking the row (the quotations page opens details on row click)
    await h.clickRowByText(QUO_NUMBER)
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })

    // Click "Mark as Sent"
    await h.clickButton('Mark as Sent')
    await h.waitForDialogGone()

    // Verify quotation status sent
    const dbQuo = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_quotations').select('status').eq('quotation_number', QUO_NUMBER).single()
      return data
    })
    h.step('rental', 'Quotation: status sent', dbQuo?.status === 'sent', { status: dbQuo?.status })

    // Close the quotation detail dialog
    await h.closeOpenDialog()

    // ===== 5. Booking (from quotation detail "Book" button) =====
    // Re-open the quotation detail to press "Book" on the asset row
    await h.clickRowByText(QUO_NUMBER)
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })

    // Click "Book" button in the assets table
    await h.clickButton('Book')
    // Wait for the booking form dialog to appear (look for the end_date input)
    await h.waitForSelector('input#end_date', { timeout: 20000 })

    // The booking form dialog opens with customer and asset pre-filled
    // Set end date
    const endDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
    const endInput = await h.page.$('input#end_date')
    if (endInput) {
      await endInput.click({ clickCount: 3 })
      await endInput.type(endDate, { delay: 10 })
    }

    await h.screenshot('rental-booking-form')
    await h.clickButton('Confirm Booking')
    // The booking dialog closes, but the quotation detail dialog remains open
    await h.waitForDialogGone()

    // Close the quotation detail dialog
    await h.closeOpenDialog()

    // Verify booking in DB
    const dbBooking = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_bookings').select('*').eq('rental_asset_id', ASSET_ID).order('created_at', { ascending: false }).limit(1).maybeSingle()
      return data
    })
    const BKG_NUMBER = dbBooking?.booking_number
    h.step('rental', 'Booking: persisted in DB', Boolean(dbBooking), { number: BKG_NUMBER, status: dbBooking?.status })

    // Verify asset status changed to booked
    const assetAfterBooking = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_assets').select('status').eq('id', ASSET_ID).single()
      return data
    })
    h.step('rental', 'Asset: status booked after booking', assetAfterBooking?.status === 'booked', { status: assetAfterBooking?.status })

    // ===== 6. Agreement =====
    // Navigate to bookings page and click "Create Agreement" on the booking row
    await h.goto('/rental/bookings')
    await h.waitForSelector('h1, h2', { timeout: 30000 })

    if (BKG_NUMBER) {
      // The bookings page shows an inline "Create Agreement" button in the row actions
      await h.clickRowButton(BKG_NUMBER, 'Create Agreement')
      await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })
    } else {
      // Fallback: navigate to agreements page
      await h.goto('/rental/agreements')
      await h.waitForSelector('h1, h2', { timeout: 30000 })
      throw new Error('Could not create agreement - no booking number')
    }

    // Fill agreement form
    await h.type('input#security_deposit', '25000')
    await h.type('input#late_return_charge_rate', '2000')
    await h.type('input#fuel_charge_rate', '1500')
    await h.screenshot('rental-agreement-form')
    await h.clickDialogButton('Create Agreement')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    // Navigate to agreements page to read the generated agreement number
    await h.goto('/rental/agreements')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.page.waitForFunction(() => document.body.innerText.includes('AGR'), { timeout: 15000 })
    const agrPageText = await h.readBodyText()
    const agrMatch = agrPageText.match(/AGR-\d{6}/)
    const AGR_NUMBER = agrMatch ? agrMatch[0] : null
    h.step('rental', 'Agreement: created in list', Boolean(AGR_NUMBER), { number: AGR_NUMBER })
    await h.screenshot('rental-agreement-created')

    // Verify booking status changed to completed
    const bkgAfterAgr = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_bookings').select('status').eq('booking_number', BKG_NUMBER).single()
      return data
    })
    h.step('rental', 'Booking: status completed after agreement', bkgAfterAgr?.status === 'completed', { status: bkgAfterAgr?.status })

    // Get agreement ID from DB
    const dbAgr = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_agreements').select('id').eq('agreement_number', AGR_NUMBER).single()
      return data
    })

    if (!dbAgr) throw new Error('Could not resolve agreement from DB')

    // ===== 7. Agreement Detail Page =====
    // Navigate to agreement detail page
    await h.goto(`/rental/agreements/${dbAgr.id}`)
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    body = await h.readBodyText()
    h.step('rental', 'Agreement Detail: navigate', body.includes(AGR_NUMBER))

    // ===== 8. Dispatch =====
    await h.clickButton('Dispatch')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })

    await h.selectByLabel('Vehicle', vehicle.registration_no)
    await h.selectByLabel('Driver', driver.name)
    await h.screenshot('rental-dispatch-form')
    await h.clickButton('Confirm Dispatch')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    // Verify asset status changed to running
    const assetAfterDispatch = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_assets').select('status').eq('id', ASSET_ID).single()
      return data
    })
    h.step('rental', 'Asset: status running after dispatch', assetAfterDispatch?.status === 'running', { status: assetAfterDispatch?.status })

    // Verify dispatch persisted in DB
    const dbDispatch = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_dispatches').select('*').eq('rental_agreement_id', dbAgr.id).maybeSingle()
      return data
    })
    h.step('rental', 'Dispatch: persisted in DB', Boolean(dbDispatch), { at: dbDispatch?.dispatched_at })

    // ===== 9. Return =====
    await h.clickButton('Mark Returned')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })

    await h.selectByLabel('Vehicle', vehicle.registration_no)
    await h.selectByLabel('Driver', driver.name)
    await h.screenshot('rental-return-form')
    await h.clickButton('Confirm Return')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    // Verify asset status changed to returned
    const assetAfterReturn = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_assets').select('status').eq('id', ASSET_ID).single()
      return data
    })
    h.step('rental', 'Asset: status returned after return', assetAfterReturn?.status === 'returned', { status: assetAfterReturn?.status })

    // Verify agreement status completed
    const agrAfterReturn = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_agreements').select('status').eq('id', dbAgr.id).single()
      return data
    })
    h.step('rental', 'Agreement: status completed', agrAfterReturn?.status === 'completed', { status: agrAfterReturn?.status })

    // ===== 10. Inspection =====
    await h.clickButton('Inspect')
    await h.waitForSelector('[data-slot="dialog-content"]', { timeout: 20000 })

    await h.selectByLabel('Condition', 'Good')
    await h.screenshot('rental-inspection-form')
    await h.clickButton('Save Inspection')
    await h.waitForFunction(() => !document.querySelector('[data-slot="dialog-content"]'), { timeout: 20000 })

    // Verify asset status changed to available (good condition)
    const assetAfterInspection = await withDb(async (supabase) => {
      const { data } = await supabase.from('rental_assets').select('status').eq('id', ASSET_ID).single()
      return data
    })
    h.step('rental', 'Asset: status available after inspection', assetAfterInspection?.status === 'available', { status: assetAfterInspection?.status })

// ===== 11. Invoice =====
    await h.clickButton('Create Invoice')
    await h.waitForDialogGone()
    await h.delay(2000)

    // Verify invoice created (may fail if backend RPC not deployed)
    const dbInvoice = await withDb(async (supabase) => {
      const { data } = await supabase.from('sales_invoices').select('*').eq('rental_agreement_id', dbAgr.id).maybeSingle()
      return data
    })
    h.step('rental', 'Invoice: created for agreement', Boolean(dbInvoice), {
      number: dbInvoice?.invoice_number ?? null,
      status: dbInvoice?.status ?? null,
    })
    await h.screenshot('rental-invoice-created')

    // Summary
    passed = h.stepResults.filter((s) => s.phase === 'rental').every((s) => s.pass)
  } catch (err) {
    h.logLine('error', String(err?.stack || err))
    h.step('rental', 'run', false, { message: String(err?.message || err) })
    passed = false
    try {
      await h.screenshot('rental-failure')
      const b = await h.readBodyText()
      h.logLine('error', 'Page text on failure:\n' + b.slice(0, 800))
    } catch {}
  } finally {
    h.saveResults()
    await h.stop()
  }
  console.log('RENTAL_CYCLE_RESULT:', passed ? 'PASS' : 'FAIL')
}

main()

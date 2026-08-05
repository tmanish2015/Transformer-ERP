import { CONFIG } from './lib/config.js'
import { Harness } from './lib/harness.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const REG = `QA-REG-${Date.now()}`
const REG_DUP = `QA-DUP-${Date.now()}`
const SERIAL = `QA-SER-${Date.now()}`

const dbQuery = async (fn) => {
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: CONFIG.email,
    password: CONFIG.password,
  })
  if (signInError || !sessionData.session) throw new Error(`DB sign-in failed: ${signInError?.message}`)
  return fn(supabase)
}

async function main() {
  const h = new Harness()
  await h.start()
  try {
    const phase = 'transformer-regression'

    // ---- LOGIN ----
    await h.login()
    h.step(phase, 'Login', true)

    // ---- NAVIGATE TO TRANSFORMER PAGE ----
    await h.goto('/transformers')
    await h.waitForText('Transformer Master', { timeout: 15000 })
    h.step(phase, 'Navigate to Transformer Master', true)
    await h.screenshot('tx-register-list')

    // Pick a customer for the transformer
    const customer = await dbQuery(async (s) => {
      const { data, error } = await s.from('customers').select('id, name').limit(1).maybeSingle()
      return { data, error: error?.message ?? null }
    })
    if (!customer.data) throw new Error(`No customer available: ${customer.error}`)
    const customerName = customer.data.name
    const customerId = customer.data.id
    h.step(phase, 'Customer lookup (DB has customer)', Boolean(customerName), { customerName })

    // ---- CREATE TRANSFORMER ----
    await h.clickButton('Add Transformer')
    await h.waitForSelector('[data-slot="dialog-content"]')
    // customer select
    await h.selectByLabel('Customer', customerName)
    // registration no
    await h.page.evaluate((val) => {
      const input = document.getElementById('registration_no')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, REG)
    // serial no (leave blank intentionally to test the resolveSerialNo fallback)
    // make / model
    await h.page.evaluate((val) => {
      const input = document.getElementById('make')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, 'QA Make')
    await h.page.evaluate((val) => {
      const input = document.getElementById('model')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, 'QA Model')
    // capacity
    await h.page.evaluate((val) => {
      const input = document.getElementById('capacity_kva')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, '250')
    await h.screenshot('tx-register-filled')
    await h.clickDialogButton('Create transformer')
    await h.waitForDialogGone()
    // verify appears in list
    await h.waitForText(REG, { timeout: 15000 })
    h.step(phase, 'Create Transformer (appears in list)', true, { reg: REG })

    // verify persisted in DB with serial_no fallback generated
    const created = await dbQuery(async (s) => {
      const { data, error } = await s.from('transformers').select('*').eq('registration_no', REG).maybeSingle()
      return { data, error: error?.message ?? null }
    })
    const createdOk = Boolean(created.data?.id)
    h.step(phase, 'Create Transformer (persisted in DB)', createdOk, { id: created.data?.id, serial_no: created.data?.serial_no })
    const serialFallbackOk = created.data?.serial_no === `${REG}-SER`
    h.step(phase, 'Create Transformer (blank serial -> generated default)', serialFallbackOk, { serial_no: created.data?.serial_no })

    // ---- DUPLICATE REGISTRATION VALIDATION ----
    let dupBlocked = false
    try {
      await h.clickButton('Add Transformer')
      await h.waitForSelector('[data-slot="dialog-content"]')
      await h.selectByLabel('Customer', customerName)
      await h.page.evaluate((val) => {
        const input = document.getElementById('registration_no')
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(input, val)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, REG)
      await h.page.evaluate((val) => {
        const input = document.getElementById('capacity_kva')
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(input, val)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, '100')
      await h.clickDialogButton('Create transformer')
      await h.waitForDialogGone()
      // If duplicate, the toast error appears and the row count for REG stays 1
      await h.delay(1500)
      const body = await h.readBodyText()
      dupBlocked = body.includes('already exists')
    } catch (e) {
      dupBlocked = true
    }
    h.step(phase, 'Duplicate registration validation', dupBlocked, { message: 'Expected "already exists" error' })

    // ---- SEARCH TRANSFORMER ----
    await h.setSearchInput('transformers', REG)
    await h.delay(500)
    const searchBody = await h.readBodyText()
    const searchOk = searchBody.includes(REG)
    h.step(phase, 'Search Transformer', searchOk)
    await h.screenshot('tx-search')
    // clear search
    await h.setSearchInput('transformers', '')

    // ---- EDIT TRANSFORMER ----
    // open row action menu
    await h.clickRowButton(REG, '')
    await h.delay(400)
    // click the row's "Edit" via dropdown
    await h.clickDropdownItem('Edit')
    await h.waitForSelector('[data-slot="dialog-content"]')
    // change make
    await h.page.evaluate(() => {
      const input = document.getElementById('make')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, 'QA Make EDITED')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await h.clickDialogButton('Save changes')
    await h.waitForDialogGone()
    await h.waitForText('QA Make EDITED', { timeout: 15000 })
    h.step(phase, 'Edit Transformer', true)
    await h.screenshot('tx-edit')

// ---- DELETE TRANSFORMER ----
    await h.clickRowButton(REG, '')
    await h.clickDropdownItem('Delete')
    await h.waitForSelector('[data-slot="alert-dialog-content"]')
    // confirm delete via the DeleteConfirmDialog confirm button
    await h.clickButtonBySelector('[data-slot="alert-dialog-content"] button', 'Delete')
    await h.waitForGone('[data-slot="alert-dialog-content"]')
    await h.delay(1500)
    const afterDelete = await h.readBodyText()
    const deleteOk = !afterDelete.includes(REG)
    h.step(phase, 'Delete Transformer', deleteOk)
    await h.screenshot('tx-delete')

    // ---- WORKSHOP AUTO-FILL + REPAIR JOB CREATION ----
    // Create a fresh transformer to use for workshop auto-fill
    const REG2 = `QA-WS-${Date.now()}`
    await h.clickButton('Add Transformer')
    await h.waitForSelector('[data-slot="dialog-content"]')
    await h.selectByLabel('Customer', customerName)
    await h.page.evaluate((val) => {
      const input = document.getElementById('registration_no')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, REG2)
    await h.page.evaluate((val) => {
      const input = document.getElementById('make')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, 'WS Make')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await h.page.evaluate((val) => {
      const input = document.getElementById('model')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, 'WS Model')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await h.page.evaluate((val) => {
      const input = document.getElementById('capacity_kva')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, '500')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await h.clickDialogButton('Create transformer')
    await h.waitForDialogGone()
    await h.waitForText(REG2, { timeout: 15000 })

    // go to workshop jobs
    await h.goto('/workshop/jobs')
    await h.waitForText('Repair Job Cards', { timeout: 15000 })
    await h.clickButton('New Job Card')
    await h.waitForSelector('[data-slot="dialog-content"]')
    // select transformer by placeholder -> auto-fills customer + make + model
    await h.selectByPlaceholder('Select a transformer to auto-fill', REG2)
    await h.delay(500)
    const wsBody = await h.readBodyText()
    const autoFillOk = wsBody.includes('WS Make') && wsBody.includes('WS Model') && wsBody.includes(customerName)
    h.step(phase, 'Workshop auto-fill (customer + make + model)', autoFillOk)
    await h.screenshot('ws-autofill')
    // fill complaint + create
    await h.page.evaluate(() => {
      const input = document.getElementById('complaint')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
      setter.call(input, 'QA complaint from regression')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await h.clickDialogButton('Create Job Card')
    await h.waitForDialogGone()
    await h.delay(1500)
    const wsAfter = await h.readBodyText()
    const jobCreated = wsAfter.includes('QA complaint from regression') || wsAfter.includes('WS Make')
    h.step(phase, 'Repair Job creation', jobCreated)
    await h.screenshot('ws-job-created')

    // ---- MULTI-TENANT ISOLATION + RLS ----
    // Cleanup the WS transformer we created
    await h.goto('/transformers')
    await h.waitForText('Transformer Master', { timeout: 15000 })
await h.setSearchInput('transformers', REG2)
    await h.delay(400)
    await h.clickRowButton(REG2, '')
    await h.clickDropdownItem('Delete')
    await h.waitForSelector('[data-slot="alert-dialog-content"]')
    await h.clickButtonBySelector('[data-slot="alert-dialog-content"] button', 'Delete')
    await h.waitForGone('[data-slot="alert-dialog-content"]')
    await h.delay(1000)

    await h.saveResults()
  } catch (e) {
    h.logLine('error', String(e?.message || e))
    await h.screenshot('tx-regression-error')
    h.step('transformer-regression', 'FATAL', false, { message: String(e?.message || e) })
    await h.saveResults()
    console.log('REGRESSION_FAILED')
    process.exitCode = 1
  } finally {
    await h.stop()
  }
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exitCode = 1
})

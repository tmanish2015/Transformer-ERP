import { CONFIG } from './lib/config.js'
import { Harness } from './lib/harness.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const REG = `QA-DIAG-${Date.now()}`
const consoleErrs = []
const pageErrs = []

async function main() {
  const h = new Harness()
  await h.start()
  try {
    // attach extra capture before login
    h.page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push('console: ' + m.text().slice(0, 400)) })
    h.page.on('pageerror', (e) => pageErrs.push('pageerror: ' + String(e).slice(0, 400)))

    await h.login()
    await h.goto('/transformers')
    await h.waitForText('Transformer Master', { timeout: 15000 })
    await h.clickButton('Add Transformer')
    await h.waitForSelector('[data-slot="dialog-content"]')

    // pick customer
    const { data: custs } = await supabase.auth.signInWithPassword({ email: CONFIG.email, password: CONFIG.password })
    const s = supabase
    let customers
    if (custs.session) { const r = await s.from('customers').select('id, name').limit(1); customers = r.data }
    const customerName = customers?.[0]?.name
    console.log('DIAG customerName =', customerName)
    await h.selectByLabel('Customer', customerName)

    // fill registration
    await h.page.evaluate((val) => {
      const input = document.getElementById('registration_no')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, REG)
    // make
    await h.page.evaluate((val) => {
      const input = document.getElementById('make')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, 'DIAG Make')
    // model
    await h.page.evaluate((val) => {
      const input = document.getElementById('model')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, 'DIAG Model')
    // capacity
    await h.page.evaluate((val) => {
      const input = document.getElementById('capacity_kva')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, '250')

    await h.delay(500)
    // dump the input values after fill
    const vals = await h.page.evaluate(() => {
      const out = {}
      for (const id of ['registration_no', 'make', 'model', 'capacity_kva', 'serial_no', 'customer_id']) {
        const el = document.getElementById(id)
        out[id] = el ? el.value : 'MISSING'
      }
      out['customer select text'] = document.querySelector('[data-slot="dialog-content"] [data-slot="select-trigger"]')?.textContent?.trim()
      return out
    })
    console.log('DIAG filled values:', JSON.stringify(vals, null, 2))

    // Are there validation errors on screen before submit?
    const preBody = await h.page.evaluate(() => document.querySelector('[data-slot="dialog-content"]').innerText)
    console.log('DIAG form text before submit:\n', preBody.slice(0, 1200))

    // click create
    await h.clickDialogButton('Create transformer')
    await h.delay(2500)

    const postBody = await h.page.evaluate(() => document.body.innerText)
    console.log('DIAG body after submit (tail):\n', postBody.slice(-1500))

    const dialogGone = await h.page.evaluate(() => {
      const d = document.querySelector('[data-slot="dialog-content"]')
      if (!d) return 'gone'
      const r = d.getBoundingClientRect()
      return r.width > 0 ? 'visible' : 'hidden'
    })
    console.log('DIAG dialog state after submit =', dialogGone)

    // check DB for the row
    const { data: createdRows } = await supabase.from('transformers').select('*').like('registration_no', 'QA-DIAG-%')
    console.log('DIAG rows in DB =', JSON.stringify(createdRows ?? [], null, 2))

    console.log('DIAG console errors:', JSON.stringify(consoleErrs, null, 2))
    console.log('DIAG page errors:', JSON.stringify(pageErrs, null, 2))
    await h.screenshot('diag-create')
  } catch (e) {
    console.log('DIAG THREW:', e.message)
    console.log('DIAG console errors:', JSON.stringify(consoleErrs, null, 2))
    console.log('DIAG page errors:', JSON.stringify(pageErrs, null, 2))
    await h.screenshot('diag-create-error')
  } finally {
    await h.stop()
  }
}
main()

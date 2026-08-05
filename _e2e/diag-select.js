// TEMPORARY diagnostic — inspects DOM state right where the product select fails.
import { Harness } from './lib/harness.js'
import { withDb } from './lib/db.js'

const h = new Harness()
const ts = () => Date.now().toString().slice(-6)
const CUST_NAME = `Diag Customer ${ts()}`

async function main() {
  try {
    await h.start()
    await h.login()

    // Create a customer directly (fast)
    await withDb(async (supabase) => {
      const { error } = await supabase.from('customers').insert({ name: CUST_NAME })
      if (error) throw new Error(`db customer: ${error.message}`)
    })

    await h.goto('/sales/quotations')
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.clickButton('New Quotation')
    await h.waitForSelector('[data-slot="sheet-content"]', { timeout: 20000 })
    await new Promise((r) => setTimeout(r, 1500))

    // Inspect all select triggers in the DOM before any selection
    let info = await h.page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-slot="select-trigger"]')).map((t) => ({
        txt: (t.textContent || '').trim(),
        visible: t.offsetParent !== null,
        rect: (() => { const r = t.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })(),
      }))
    })
    console.log('DIAG TRIGGERS_BEFORE:', JSON.stringify(info))

    // Select customer via existing harness helper
    await h.selectByLabel('Customer', CUST_NAME)
    await h.waitForGone('[data-slot="select-content"]', { timeout: 5000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 500))
    console.log('DIAG customer selected.')

    // Inspect the product trigger + what element is at its center + popup state
    const diag = await h.page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'))
      const out = { triggers: [], selectContents: [] }
      for (const table of tables) {
        const row = table.querySelector('tbody tr')
        if (!row) continue
        for (const t of Array.from(row.querySelectorAll('[data-slot="select-trigger"]'))) {
          const r = t.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const elAt = document.elementFromPoint(cx, cy)
          out.triggers.push({
            txt: (t.textContent || '').trim(),
            visible: t.offsetParent !== null,
            rect: { x: r.x, y: r.y, w: r.width, h: r.height },
            elAtPoint: elAt ? `${elAt.tagName}.${elAt.className}`.slice(0, 120) : null,
            dataSlot: elAt ? elAt.getAttribute('data-slot') : null,
          })
        }
      }
      out.selectContents = Array.from(document.querySelectorAll('[data-slot="select-content"]')).map((e) => ({
        visible: e.offsetParent !== null,
        rect: (() => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })(),
      }))
      return out
    })
    console.log('DIAG AFTER_CUSTOMER:', JSON.stringify(diag))

    // Attempt 1: real mouse click via coordinates
    const pos = diag.triggers.find((t) => t.visible && t.txt.toLowerCase().includes('select product'))
    if (pos) {
      console.log('DIAG clicking at', pos.rect.x + pos.rect.w / 2, pos.rect.y + pos.rect.h / 2)
      await h.page.mouse.click(pos.rect.x + pos.rect.w / 2, pos.rect.y + pos.rect.h / 2)
      await new Promise((r) => setTimeout(r, 1200))
      const st = await h.page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-slot="select-content"]')).map((e) => ({
          visible: e.offsetParent !== null,
          rect: (() => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })(),
        })),
      )
      console.log('DIAG popup after mouse click:', JSON.stringify(st))
    }

    await h.screenshot('diag-select')
  } catch (e) {
    console.log('DIAG ERROR:', e?.stack || e)
    try {
      await h.screenshot('diag-select-failure')
    } catch {}
  } finally {
    await h.stop()
  }
}

main()


import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { CONFIG } from './config.js'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export class Harness {
  constructor() {
    this.browser = null
    this.page = null
    this.log = []
    this.stepResults = []
  }

  logLine(level, msg) {
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}`
    this.log.push(line)
    console.log(line)
  }

  async start() {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true })
    fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true })
    this.browser = await puppeteer.launch({
      executablePath: CONFIG.chromePath,
      headless: CONFIG.headless ? 'new' : false,
      defaultViewport: CONFIG.viewport,
      protocolTimeout: 120000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
    })
    this.page = await this.browser.newPage()
    this.page.setDefaultTimeout(CONFIG.timeout)
    this.page.setDefaultNavigationTimeout(30000)
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') this.logLine('browser-console-error', msg.text().slice(0, 300))
    })
    this.page.on('pageerror', (err) => this.logLine('pageerror', String(err).slice(0, 300)))
    this.logLine('info', `Browser launched (headless=${CONFIG.headless})`)
  }

  async stop() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async goto(pathname = '/', opts = {}) {
    await this.page.goto(`${CONFIG.appUrl}${pathname}`, { waitUntil: 'networkidle0', timeout: 30000, ...opts })
  }

  async screenshot(name) {
    const file = path.join(CONFIG.screenshotsDir, `${name}.png`)
    await this.page.screenshot({ path: file, fullPage: false })
    this.logLine('info', `Screenshot saved: ${file}`)
    return file
  }

  async waitForText(text, { timeout = CONFIG.timeout, exact = false } = {}) {
    const xpath = exact
      ? `//*[normalize-space(.)='${text}']`
      : `//*[contains(normalize-space(.),'${text}')]`
    const ok = await this.page.waitForFunction(
      (x) => {
        const res = document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        return Boolean(res.singleNodeValue)
      },
      { timeout },
      xpath,
    )
    return ok
  }

  async waitForSelector(selector, { timeout = CONFIG.timeout } = {}) {
    await this.page.waitForSelector(selector, { timeout, visible: true })
  }

  async waitForFunction(fn, opts = {}, ...args) {
    return this.page.waitForFunction(fn, opts, ...args)
  }

  async waitForGone(selector, { timeout = CONFIG.timeout } = {}) {
    await this.page.waitForSelector(selector, { timeout, hidden: true })
  }

  async textExists(text, { exact = false } = {}) {
    const xpath = exact
      ? `//*[normalize-space(.)='${text}']`
      : `//*[contains(normalize-space(.),'${text}')]`
    return this.page.evaluate((x) => {
      const res = document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      return Boolean(res.singleNodeValue)
    }, xpath)
  }

  async type(selector, value, opts = {}) {
    const el = await this.page.$(selector)
    if (!el) throw new Error(`Element not found: ${selector}`)
    await el.click({ clickCount: 3 })
    await this.page.type(selector, value, { delay: 15, ...opts })
  }

  async click(selector) {
    const el = await this.page.$(selector)
    if (!el) throw new Error(`Click target not found: ${selector}`)
    await el.click()
  }

  async clickByText(text, { exact = false } = {}) {
    const xpath = exact
      ? `//*[normalize-space(.)='${text}']`
      : `//*[contains(normalize-space(.),'${text}')]`
    const clicked = await this.page.evaluate((x) => {
      const res = document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      const node = res.singleNodeValue
      if (node) {
        if (typeof node.click === 'function') {
          node.click()
          return true
        }
        const wrapper = node.closest('button, [role="button"], a, label, input, [data-slot]')
        if (wrapper) {
          wrapper.click()
          return true
        }
      }
      return false
    }, xpath)
    if (!clicked) throw new Error(`Click target not found by text: ${text}`)
    await delay(300)
  }

  async readTable() {
    const rows = await this.page.evaluate(() => {
      const table = document.querySelector('table')
      if (!table) return []
      const out = []
      const trs = table.querySelectorAll('tbody tr')
      for (const tr of trs) {
        const cells = []
        for (const td of tr.querySelectorAll('td')) {
          cells.push((td.textContent || '').trim())
        }
        out.push(cells)
      }
      return out
    })
    return rows
  }

  async readTableText() {
    const rows = await this.readTable()
    return rows.map((r) => r.join(' | ')).join('\n')
  }

  async readBodyText() {
    return this.page.evaluate(() => document.body.innerText)
  }

  async clickRowByText(rowText) {
    await this.page.waitForSelector('table')
    const pos = await this.page.evaluate((txt) => {
      const rows = document.querySelectorAll('table tbody tr')
      for (const tr of rows) {
        const text = (tr.textContent || '').toLowerCase()
        if (text.includes(txt.toLowerCase())) {
          const r = tr.getBoundingClientRect()
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        }
      }
      return null
    }, rowText)
    if (!pos) throw new Error(`Could not find row to click: ${rowText}`)
    await this.page.mouse.click(pos.x, pos.y)
    await delay(500)
  }

  async clickRowButton(rowText, buttonText) {
    await this.page.waitForSelector('table')
    const clicked = await this.page.evaluate((rowTxt, btnTxt) => {
      const rows = document.querySelectorAll('table tbody tr')
      for (const tr of rows) {
        const text = (tr.textContent || '').toLowerCase()
        if (text.includes(rowTxt.toLowerCase())) {
          const buttons = tr.querySelectorAll('button')
          for (const b of buttons) {
            if ((b.textContent || '').trim().toLowerCase().includes(btnTxt.toLowerCase()) && b.offsetParent !== null) {
              b.click()
              return true
            }
          }
        }
      }
      return false
    }, rowText, buttonText)
    if (!clicked) throw new Error(`Could not find button "${buttonText}" in row: ${rowText}`)
    await delay(500)
  }

  async clickDropdownItem(itemText) {
    await this.waitForSelector('[data-slot="dropdown-menu-content"]')
    const clicked = await this.page.evaluate((txt) => {
      const items = document.querySelectorAll('[data-slot="dropdown-menu-item"]')
      for (const it of items) {
        if ((it.textContent || '').trim().toLowerCase().includes(txt.toLowerCase())) {
          it.click()
          return true
        }
      }
      return false
    }, itemText)
    if (!clicked) throw new Error(`Dropdown item not found: ${itemText}`)
    await delay(400)
  }

  async selectOption(triggerSelector, optionText) {
    const el = await this.page.$(triggerSelector)
    if (!el) throw new Error(`Select trigger not found: ${triggerSelector}`)
    const box = await el.boundingBox()
    if (!box) throw new Error(`Select trigger not visible: ${triggerSelector}`)
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await this.waitForSelector('[data-slot="select-content"]')
    return this.pickSelectOption(optionText)
  }

async clickButtonBySelector(containerSelector, text) {
    const clicked = await this.page.evaluate(({ sel, txt }) => {
      const containers = Array.from(document.querySelectorAll(sel)).filter(
        (e) => e.getBoundingClientRect().width > 0,
      )
      const tryClick = (b) => {
        if ((b.textContent || '').trim() === txt) {
          b.click()
          return true
        }
        if ((b.textContent || '').trim().includes(txt)) {
          b.click()
          return true
        }
        return false
      }
      for (const c of containers) {
        // If the container element itself is a button, try it directly
        if (c.tagName === 'BUTTON' && tryClick(c)) return true
        // Otherwise look at buttons inside the container
        for (const b of c.querySelectorAll('button')) {
          if (tryClick(b)) return true
        }
      }
      return false
    }, { sel: containerSelector, txt: text })
    if (!clicked) throw new Error(`Button "${text}" not found inside "${containerSelector}"`)
    await delay(400)
  }

  async clickDialogButton(text) {
    const clicked = await this.page.evaluate((txt) => {
      const dialogs = Array.from(document.querySelectorAll('[data-slot="dialog-content"], [data-slot="sheet-content"]')).filter(
        (e) => e.getBoundingClientRect().width > 0,
      )
      for (const d of dialogs) {
        const buttons = d.querySelectorAll('button')
        for (const b of buttons) {
          if ((b.textContent || '').trim() === txt) {
            b.click()
            return true
          }
        }
        for (const b of buttons) {
          if ((b.textContent || '').trim().includes(txt)) {
            b.click()
            return true
          }
        }
      }
      return false
    }, text)
    if (!clicked) throw new Error(`Dialog button not found: ${text}`)
    await delay(400)
  }

  async clickButton(text) {
    const clicked = await this.page.evaluate((txt) => {
      const buttons = document.querySelectorAll('button')
      for (const b of buttons) {
        if ((b.textContent || '').trim() === txt && b.offsetParent !== null) {
          b.click()
          return true
        }
      }
      for (const b of buttons) {
        if ((b.textContent || '').trim().includes(txt) && b.offsetParent !== null) {
          b.click()
          return true
        }
      }
      return false
    }, text)
    if (!clicked) throw new Error(`Button not found: ${text}`)
    await delay(400)
  }

  async waitForDialogGone() {
    await delay(700)
  }

  async delay(ms) {
    await delay(ms)
  }

  async login() {
    let lastError
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await this.goto('/login', { waitUntil: 'domcontentloaded' })
        await this.waitForSelector('input[name="email"]', { timeout: 30000 })
        await this.waitForSelector('input[name="password"]', { timeout: 30000 })
        await this.page.focus('input[name="email"]')
        await this.page.type('input[name="email"]', CONFIG.email, { delay: 15 })
        await this.page.focus('input[name="password"]')
        await this.page.type('input[name="password"]', CONFIG.password, { delay: 15 })
        await this.clickByText('Sign in', { exact: true })
        await this.page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 30000 })
        this.logLine('info', `Signed in. URL: ${await this.currentUrl()}`)
        return
      } catch (e) {
        lastError = e
        this.logLine('warn', `Login attempt ${attempt} failed: ${String(e?.message || e)}`)
        await delay(3000)
      }
    }
    throw lastError
  }

  /** Find a select trigger by label text and click it via Puppeteer element handle, then pick the option. */
  async selectByLabel(labelText, optionText) {
    // Find the trigger element handle directly
    const triggerEl = await this.page.evaluateHandle((label) => {
      const triggers = document.querySelectorAll('[data-slot="select-trigger"]')
      for (const t of triggers) {
        if (t.offsetParent === null) continue
        let container = t.parentElement
        while (container && container !== document.body) {
          const lbl = container.querySelector('label')
          if (lbl && (lbl.textContent || '').trim() === label) {
            return t
          }
          container = container.parentElement
        }
      }
      return null
    }, labelText)

    if (!triggerEl || triggerEl.asElement() === null) {
      throw new Error(`Select trigger not found for label: ${labelText}`)
    }

    // Click using Puppeteer's element handle click (generates real browser events)
    const el = triggerEl.asElement()
    await el.click()
    await delay(300)

    // Wait for a visible select-content popup
    let opened = false
    for (let attempt = 1; attempt <= 5; attempt++) {
      const ok = await this.page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('[data-slot="select-content"]'))
        return els.some((e) => {
          const rect = e.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
      })
      if (ok) {
        opened = true
        break
      }
      await delay(500)
    }
    if (!opened) throw new Error(`Select popup did not open for label: ${labelText}`)

    return this.pickSelectOption(optionText)
  }

  async selectByPlaceholder(placeholderText, optionText) {
    const pos = await this.page.evaluate((ph) => {
      const triggers = document.querySelectorAll('[data-slot="select-trigger"]')
      for (const t of triggers) {
        if (t.offsetParent === null) continue
        const txt = (t.textContent || '').trim()
        if (txt.toLowerCase().includes(ph.toLowerCase())) {
          const r = t.getBoundingClientRect()
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        }
      }
      return null
    }, placeholderText)
    if (!pos) throw new Error(`Select trigger not found for placeholder: ${placeholderText}`)
    await this.clickSelectTrigger(pos)
    return this.pickSelectOption(optionText)
  }

  async clickSelectTrigger(pos) {
    let opened = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.mouse.click(pos.x, pos.y)
      await delay(300)
      const ok = await this.page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('[data-slot="select-content"]'))
        return els.some((e) => {
          const rect = e.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
      })
      if (ok) {
        opened = true
        break
      }
      await delay(500)
    }
    if (!opened) throw new Error('Select popup did not open')
  }

  async selectFirstRentalTableAsset(optionText) {
    await this.waitForGone('[data-slot="select-content"]', { timeout: 5000 }).catch(() => {})
    await delay(200)

    const pos = await this.page.evaluate(() => {
      const tables = document.querySelectorAll('table')
      for (const table of tables) {
        const row = table.querySelector('tbody tr')
        if (!row) continue
        const triggers = row.querySelectorAll('[data-slot="select-trigger"]')
        for (const t of triggers) {
          if (t.offsetParent !== null && (t.textContent || '').trim().toLowerCase().includes('select asset')) {
            const r = t.getBoundingClientRect()
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          }
        }
      }
      return null
    })
    if (!pos) throw new Error('Asset select trigger not found in first table row')

    let opened = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.mouse.click(pos.x, pos.y)
      const ok = await this.page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('[data-slot="select-content"]'))
        return els.some((e) => {
          const rect = e.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
      })
      if (ok) {
        opened = true
        break
      }
      await delay(500)
    }
    if (!opened) throw new Error(`Asset select popup did not open for: ${optionText}`)
    return this.pickSelectOption(optionText)
  }

  async selectFirstTableProduct(optionText) {
    await this.waitForGone('[data-slot="select-content"]', { timeout: 5000 }).catch(() => {})
    await delay(200)

    const pos = await this.page.evaluate(() => {
      const tables = document.querySelectorAll('table')
      for (const table of tables) {
        const row = table.querySelector('tbody tr')
        if (!row) continue
        const triggers = row.querySelectorAll('[data-slot="select-trigger"]')
        for (const t of triggers) {
          if (t.offsetParent !== null && (t.textContent || '').trim().toLowerCase().includes('select product')) {
            const r = t.getBoundingClientRect()
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          }
        }
      }
      return null
    })
    if (!pos) throw new Error('Product select trigger not found in first table row')

    let opened = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.mouse.click(pos.x, pos.y)
      const ok = await this.page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('[data-slot="select-content"]'))
        return els.some((e) => {
          const rect = e.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
      })
      if (ok) {
        opened = true
        break
      }
      await delay(500)
    }
    if (!opened) throw new Error(`Product select popup did not open for: ${optionText}`)
    return this.pickSelectOption(optionText)
  }

  async pickSelectOption(optionText) {
    const pos = await this.page.evaluate((txt) => {
      const popups = Array.from(document.querySelectorAll('[data-slot="select-content"]')).filter((e) => {
        const rect = e.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      for (const popup of popups) {
        for (const it of popup.querySelectorAll('[data-slot="select-item"]')) {
          const label = (it.textContent || '').trim().toLowerCase()
          if (label === txt.toLowerCase() || label.includes(txt.toLowerCase())) {
            const r = it.getBoundingClientRect()
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          }
        }
      }
      return null
    }, optionText)
    if (!pos) throw new Error(`Select option not found: ${optionText}`)
    await this.page.mouse.click(pos.x, pos.y)
    await delay(300)
  }

  async setLineItemQty(qty) {
    await this.page.evaluate((qty) => {
      const tables = document.querySelectorAll('table')
      for (const table of tables) {
        const row = table.querySelector('tbody tr')
        if (!row) continue
        if (row.querySelectorAll('[data-slot="select-trigger"]').length === 0) continue
        const input = row.querySelector('input[type="number"]')
        if (!input) continue
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(input, '')
        input.dispatchEvent(new Event('input', { bubbles: true }))
        setter.call(input, String(qty))
        input.dispatchEvent(new Event('input', { bubbles: true }))
        return
      }
    }, qty)
    await delay(200)
  }

  async closeOpenDialog() {
    await this.page.keyboard.press('Escape')
    await delay(900)
  }

  async setSearchInput(placeholder, term) {
    const inputId = await this.page.evaluate((ph) => {
      const inputs = Array.from(document.querySelectorAll('input'))
      const target = inputs.find((i) => (i.placeholder || '').toLowerCase().includes(ph.toLowerCase()))
      if (!target) return null
      if (target.id) return target.id
      target.id = 'e2e-search-input'
      return 'e2e-search-input'
    }, placeholder)
    if (!inputId) throw new Error(`Search input not found for placeholder: ${placeholder}`)
    await this.page.evaluate((term) => {
      const input = document.getElementById('e2e-search-input')
      if (!input) return
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      setter.call(input, term)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, term)
    await delay(400)
  }

  async currentUrl() {
    return this.page.url()
  }

  step(phase, name, pass, details = {}) {
    const rec = { phase, name, pass: Boolean(pass), at: new Date().toISOString(), ...details }
    this.stepResults.push(rec)
    this.logLine(pass ? 'pass' : 'fail', `${phase} :: ${name} ${pass ? '✅' : '❌'} ${details.message || ''}`)
    return rec
  }

  saveResults() {
    const out = {
      finishedAt: new Date().toISOString(),
      steps: this.stepResults,
      log: this.log,
    }
    fs.writeFileSync(path.join(CONFIG.resultsDir, 'e2e-results.json'), JSON.stringify(out, null, 2))
    return out
  }
}

// _e2e/run-smoke.js — login via UI and land on dashboard.
import { Harness } from './lib/harness.js'
import { CONFIG } from './lib/config.js'

const h = new Harness()

async function main() {
  try {
    await h.start()

    // Log network responses for auth to diagnose login failures.
    const authResponses = []
    h.page.on('response', (resp) => {
      const u = resp.url()
      if (u.includes('/auth/v1/token') || u.includes('auth/v1/verify')) {
        authResponses.push({ url: u, status: resp.status() })
        if (resp.status() >= 400) {
          resp.json().then((j) => authResponses.push({ errorBody: JSON.stringify(j).slice(0, 300) })).catch(() => {})
        }
      }
    })

    await h.goto('/login', { waitUntil: 'domcontentloaded' })
    await h.waitForSelector('input[name="email"]', { timeout: 30000 })
    await h.waitForSelector('input[name="password"]', { timeout: 30000 })
    h.step('smoke', 'Login page rendered', true)

    await h.page.focus('input[name="email"]')
    await h.page.type('input[name="email"]', CONFIG.email, { delay: 20 })
    await h.page.focus('input[name="password"]')
    await h.page.type('input[name="password"]', CONFIG.password, { delay: 20 })

    const vals = await h.page.evaluate(() => ({
      email: document.querySelector('input[name="email"]')?.value,
      password: document.querySelector('input[name="password"]')?.value,
    }))
    console.log('FIELD VALUES:', JSON.stringify(vals))
    await h.screenshot('smoke-before-submit')

    await h.clickByText('Sign in', { exact: true })
    await new Promise((r) => setTimeout(r, 8000))

    const url = await h.currentUrl()
    const body = await h.readBodyText()
    const alertText = await h.page.evaluate(() => {
      const els = document.querySelectorAll('[role="alert"]')
      return Array.from(els).map((e) => e.textContent?.trim())
    })

    console.log('URL AFTER LOGIN:', url)
    console.log('ALERTS:', JSON.stringify(alertText))
    console.log('AUTH RESPONSES:', JSON.stringify(authResponses, null, 2))

    const landed = !url.includes('/login')
    h.step('smoke', 'Signed in and landed on app', landed, {
      url,
      alerts: alertText,
      authResponses,
      bodySnippet: body.slice(0, 500),
    })

    await h.screenshot('smoke-dashboard')
  } catch (err) {
    h.logLine('error', String(err?.stack || err))
    h.step('smoke', 'smoke test', false, { message: String(err?.message || err) })
    try {
      await h.screenshot('smoke-failure')
    } catch {}
  } finally {
    h.saveResults()
    await h.stop()
  }
}

main()


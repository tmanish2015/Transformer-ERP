import puppeteer from 'puppeteer-core'
import { CONFIG } from './lib/config.js'

const b = await puppeteer.launch({
  executablePath: CONFIG.chromePath,
  headless: 'new',
  defaultViewport: CONFIG.viewport,
  protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
})
const p = await b.newPage()
p.setDefaultTimeout(30000)
try {
  await p.goto('https://transformer-erp.vercel.app/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await p.type('input[name=email]', CONFIG.email, { delay: 15 })
  await p.type('input[name=password]', CONFIG.password, { delay: 15 })
  await p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Sign in')
    if (b) b.click()
  })
  await p.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 30000 })
  console.log('Signed in, URL:', p.url())

  await p.goto('https://transformer-erp.vercel.app/transformers', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 4000))
  console.log('After goto /transformers, URL:', p.url())
  const body = await p.evaluate(() => document.body.innerText)
  console.log('BODY (first 800):\n', body.slice(0, 800))
  await p.screenshot({ path: 'screenshots/diag-transformers-page.png' })
} catch (e) {
  console.log('URL at error:', p.url())
  console.error('ERR', e.message)
  await p.screenshot({ path: 'screenshots/diag-transformers-error.png' })
} finally {
  await b.close()
}

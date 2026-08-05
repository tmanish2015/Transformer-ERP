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

  // Check nav for Transformer Master
  const nav = await p.evaluate(() => {
    const links = [...document.querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim() }))
    return links.filter((l) => l.text && l.text.length < 40)
  })
  console.log('NAV LINKS (first 40):', JSON.stringify(nav.slice(0, 40), null, 1))

  await p.goto('https://transformer-erp.vercel.app/transformers', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 6000))
  console.log('After /transformers, URL:', p.url())
  const html = await p.evaluate(() => document.documentElement.outerHTML)
  console.log('HTML length:', html.length)
  console.log('BODY text:', (await p.evaluate(() => document.body.innerText)).slice(0, 500))
  console.log('Has Transformer Master:', (await p.evaluate(() => document.body.innerText)).includes('Transformer Master'))
  await p.screenshot({ path: 'screenshots/diag-transformers-page2.png' })
} catch (e) {
  console.log('URL at error:', p.url())
  console.error('ERR', e.message)
  await p.screenshot({ path: 'screenshots/diag-transformers-error2.png' })
} finally {
  await b.close()
}

// Diagnose whether the DEPLOYED Vercel app has the GSTIN columns.
// Navigates to each sales list and prints table headers.
import { Harness } from './lib/harness.js'

const h = new Harness()

async function headers() {
  return h.page.evaluate(() => {
    const table = document.querySelector('table')
    if (!table) return []
    const ths = table.querySelectorAll('thead th')
    return Array.from(ths).map((th) => (th.textContent || '').trim())
  })
}

async function checkPage(name, pathname) {
  try {
    await h.goto(pathname)
    await h.waitForSelector('h1, h2', { timeout: 30000 })
    await h.delay(2500)
    const hs = await headers()
    console.log(`\n[${name}] ${pathname}`)
    console.log('HEADERS:', JSON.stringify(hs))
    await h.screenshot(`diag-deployed-${name.toLowerCase().replace(/\s+/g, '-')}`)
  } catch (err) {
    console.log(`\n[${name}] ERROR: ${err.message}`)
  }
}

async function main() {
  try {
    await h.start()
    await h.login()
    await checkPage('Customers', '/sales/customers')
    await checkPage('Quotations', '/sales/quotations')
    await checkPage('SalesOrders', '/sales/orders')
    await checkPage('DeliveryChallans', '/sales/delivery-challans')
    await checkPage('Invoices', '/sales/invoices')
  } catch (err) {
    console.log('FATAL:', err.message)
  } finally {
    await h.stop()
  }
}

main()


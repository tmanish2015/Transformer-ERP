import { Harness } from './lib/harness.js'

const h = new Harness()
await h.start()
try {
  await h.login()
  await h.goto('/workshop/jobs', { waitUntil: 'domcontentloaded' })
  await h.delay(4000)
  const body = await h.readBodyText()
  console.log('URL:', await h.currentUrl())
  console.log('BODY HEAD:\n', body.slice(0, 1200))
  await h.screenshot('ws-diag')
} catch (e) {
  console.log('ERR', String(e?.message || e))
} finally {
  await h.stop()
}
process.exit(0)

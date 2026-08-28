import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
const errors = []
const failures = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
page.on('requestfailed', request => failures.push(`${request.url()} ${request.failure()?.errorText}`))
await page.goto('https://scan-repair-local.sociobot.in/demo', { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: 'Field notes · sample page' }).waitFor()
await page.waitForFunction(async () => Boolean(navigator.serviceWorker?.controller) && Boolean(await caches.match('/demo')))
const before = await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration()
  await registration?.update()
  await new Promise(resolve => setTimeout(resolve, 750))
  const refreshed = await navigator.serviceWorker.getRegistration()
  return { controller: Boolean(navigator.serviceWorker?.controller), active: refreshed?.active?.state, waiting: refreshed?.waiting?.state, caches: await caches.keys() }
})
await context.setOffline(true)
await page.reload({ waitUntil: 'domcontentloaded' })
const offline = await page.getByRole('heading', { name: 'Field notes · sample page' }).isVisible()
console.log(JSON.stringify({ before, offline, errors, failures }, null, 2))
await browser.close()

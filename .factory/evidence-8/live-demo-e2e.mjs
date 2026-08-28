import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
const page = await context.newPage()
const requests = []
const errors = []
page.on('request', request => requests.push(request.url()))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('https://scan-repair-local.sociobot.in/demo', { waitUntil: 'networkidle', timeout: 60_000 })
const image = page.locator('#page-image')
const original = await image.getAttribute('src')
await page.getByRole('button', { name: 'Turn right' }).click()
await page.getByRole('button', { name: 'Apply reversible repair' }).click()
await page.getByRole('button', { name: 'Undo last repair' }).waitFor()
const changed = (await image.getAttribute('src')) !== original
await page.getByRole('button', { name: 'Undo last repair' }).click()
const restored = (await image.getAttribute('src')) === original
await page.getByRole('button', { name: 'Flag for manual check' }).click()
const flagged = await page.getByText('Flagged for review').isVisible()

const downloadPromise = page.waitForEvent('download')
await page.getByRole('button', { name: 'Export Markdown' }).click()
const download = await downloadPromise
const stream = await download.createReadStream()
const chunks = []
for await (const chunk of stream) chunks.push(chunk)
const markdown = Buffer.concat(chunks).toString('utf8')

const worker = page.waitForResponse(response => response.url().includes('/ocr/worker.min.js'))
await page.getByRole('button', { name: 'Run OCR again' }).click()
await worker
await page.getByText('recognised on this device').waitFor({ timeout: 150_000 })
const ocr = {
  textLength: (await page.getByLabel('Recognised page text').inputValue()).length,
  result: await page.locator('.ocr-result').innerText()
}
const serviceWorker = await page.evaluate(async () => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  const registration = await navigator.serviceWorker.getRegistration()
  return {
    controller: Boolean(navigator.serviceWorker?.controller),
    state: registration?.active?.state,
    caches: await caches.keys(),
    demoCached: Boolean(await caches.match('/demo')),
    storage: { local: [...Object.keys(localStorage)], session: [...Object.keys(sessionStorage)] }
  }
})

console.log(JSON.stringify({
  changed,
  restored,
  flagged,
  markdown: {
    name: download.suggestedFilename(),
    hasPageReference: markdown.includes('## Page 1'),
    hasConfidenceLabel: markdown.includes('OCR confidence')
  },
  ocr,
  requests,
  thirdParty: requests.filter(url => new URL(url).origin !== 'https://scan-repair-local.sociobot.in'),
  errors,
  serviceWorker
}, null, 2))

await browser.close()

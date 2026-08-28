import { chromium } from 'playwright'
import axe from 'axe-core'

const url = 'https://scan-repair-local.sociobot.in'
const browser = await chromium.launch({ headless: true })

async function axeResults(page) {
  await page.addScriptTag({ content: axe.source })
  return page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })).violations.map(item => ({ id: item.id, impact: item.impact })))
}

const desktop = await browser.newContext({ bypassCSP: true, viewport: { width: 1440, height: 960 } })
const landing = await desktop.newPage()
const landingErrors = []
landing.on('console', message => { if (message.type() === 'error') landingErrors.push(message.text()) })
landing.on('pageerror', error => landingErrors.push(String(error)))
await landing.goto(url, { waitUntil: 'networkidle' })
const landingAxe = await axeResults(landing)
await landing.locator('.skip-link').focus()
const skipVisible = await landing.locator('.skip-link').isVisible()
await landing.keyboard.press('Enter')
const skipFocusedMain = await landing.locator('main').evaluate(node => document.activeElement === node)
await landing.getByRole('button', { name: 'Choose a scan' }).focus()
const focus = await landing.getByRole('button', { name: 'Choose a scan' }).evaluate(node => {
  const style = getComputedStyle(node)
  return { outline: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor }
})

const recovery = await desktop.newPage()
await recovery.goto(url)
const invalid = await Promise.all([
  recovery.waitForEvent('dialog').then(async dialog => { const message = dialog.message(); await dialog.accept(); return message }),
  recovery.locator('#file-input').setInputFiles({ name: 'not-a-scan.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') })
])
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
await recovery.locator('#file-input').setInputFiles([
  { name: 'normal.png', mimeType: 'image/png', buffer: pixel },
  { name: 'second.png', mimeType: 'image/png', buffer: pixel }
])
await recovery.getByRole('heading', { name: 'second.png' }).waitFor()
const normalImport = { pages: await recovery.locator('.page-chip').count(), heading: await recovery.locator('h1').innerText() }

const demo = await desktop.newPage()
await demo.goto(`${url}/demo`, { waitUntil: 'networkidle' })
const demoAxeLight = await axeResults(demo)
await demo.getByRole('button', { name: 'Toggle color scheme' }).click()
const demoAxeDark = await axeResults(demo)
await demo.screenshot({ path: '.factory/evidence-8/live-demo-desktop.png', fullPage: true })

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const mobile = await mobileContext.newPage()
await mobile.goto(`${url}/demo`, { waitUntil: 'networkidle' })
await mobile.screenshot({ path: '.factory/evidence-8/live-demo-390.png', fullPage: true })
const mobileData = {
  scrollWidth: await mobile.locator('body').evaluate(node => node.scrollWidth),
  viewportWidth: await mobile.locator('body').evaluate(() => innerWidth),
  primarySize: await mobile.getByRole('button', { name: 'Apply reversible repair' }).evaluate(node => { const r = node.getBoundingClientRect(); return { width: r.width, height: r.height } }),
  resetSize: await mobile.getByRole('button', { name: 'Reset demo' }).evaluate(node => { const r = node.getBoundingClientRect(); return { width: r.width, height: r.height } })
}

const reducedContext = await browser.newContext({ reducedMotion: 'reduce' })
const reduced = await reducedContext.newPage()
await reduced.goto(`${url}/demo`)
const reducedMotion = await reduced.locator('#page-image').evaluate(node => ({ transitionDuration: getComputedStyle(node).transitionDuration, animationDuration: getComputedStyle(node).animationDuration }))

console.log(JSON.stringify({
  landing: { axe: landingAxe, skipVisible, skipFocusedMain, focus, errors: landingErrors },
  recovery: { invalidMessage: invalid[0], normalImport },
  demo: { axeLight: demoAxeLight, axeDark: demoAxeDark },
  mobile: mobileData,
  reducedMotion
}, null, 2))

await browser.close()

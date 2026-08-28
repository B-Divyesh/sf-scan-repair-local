import { chromium } from 'playwright'
import axe from 'axe-core'

const origin = 'https://scan-repair-local.sociobot.in'
const browser = await chromium.launch({ headless: true })
const desktop = await browser.newContext({ bypassCSP: true, viewport: { width: 1440, height: 960 } })

async function scan(page) {
  await page.addScriptTag({ content: axe.source })
  return (await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })).violations))
    .filter(item => item.impact === 'serious' || item.impact === 'critical')
    .map(item => ({ id: item.id, impact: item.impact }))
}

const landing = await desktop.newPage()
const landingErrors = []
landing.on('console', message => { if (message.type() === 'error') landingErrors.push(message.text()) })
landing.on('pageerror', error => landingErrors.push(String(error)))
await landing.goto(origin, { waitUntil: 'networkidle' })
const priceCopy = await landing.locator('.download > div:first-child > p:not(.eyebrow):not(.microcopy)').innerText()
const buyLink = await landing.getByRole('link', { name: 'Buy Local Pro · $19 once' }).getAttribute('href')
const releaseNote = await landing.locator('#platform-note').innerText()
await landing.locator('.skip-link').focus()
await landing.keyboard.press('Enter')
const mainFocused = await landing.locator('main').evaluate(node => document.activeElement === node)
const landingAxe = await scan(landing)

const demo = await desktop.newPage()
const requests = []
const demoErrors = []
demo.on('request', request => requests.push(request.url()))
demo.on('console', message => { if (message.type() === 'error') demoErrors.push(message.text()) })
demo.on('pageerror', error => demoErrors.push(String(error)))
await demo.goto(`${origin}/demo`, { waitUntil: 'networkidle' })
const demoAxeLight = await scan(demo)
await demo.getByRole('button', { name: 'Toggle color scheme' }).click()
const demoAxeDark = await scan(demo)
await demo.getByRole('button', { name: 'Turn right' }).click()
await demo.getByRole('button', { name: 'Apply reversible repair' }).click()
const markdown = demo.waitForEvent('download')
await demo.getByRole('button', { name: 'Export Markdown' }).click()
await markdown

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const mobile = await mobileContext.newPage()
await mobile.goto(`${origin}/demo`, { waitUntil: 'networkidle' })
const mobileLayout = await mobile.evaluate(() => ({
  width: innerWidth,
  scrollWidth: document.body.scrollWidth,
  imageWidth: document.querySelector('#page-image')?.getAttribute('width'),
  imageHeight: document.querySelector('#page-image')?.getAttribute('height'),
}))
const primaryHeight = await mobile.getByRole('button', { name: 'Apply reversible repair' }).evaluate(node => node.getBoundingClientRect().height)
await mobile.evaluate(() => { document.documentElement.style.fontSize = '200%' })
const textResize = await mobile.evaluate(() => ({ width: innerWidth, scrollWidth: document.body.scrollWidth, exportVisible: Boolean(document.querySelector('#markdown')?.getBoundingClientRect().height) }))

const reducedContext = await browser.newContext({ reducedMotion: 'reduce' })
const reduced = await reducedContext.newPage()
await reduced.goto(`${origin}/demo`)
const reducedMotion = await reduced.locator('#page-image').evaluate(node => getComputedStyle(node).transitionDuration)

console.log(JSON.stringify({
  landing: { priceCopy, buyLink, releaseNote, mainFocused, axe: landingAxe, errors: landingErrors },
  demo: { axeLight: demoAxeLight, axeDark: demoAxeDark, errors: demoErrors, thirdPartyDocumentRequests: requests.filter(url => !url.startsWith(origin) && !url.startsWith('blob:')) },
  mobile: { ...mobileLayout, primaryHeight, textResize },
  reducedMotion,
}, null, 2))

await browser.close()

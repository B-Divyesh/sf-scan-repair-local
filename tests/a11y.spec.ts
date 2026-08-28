import { test, expect } from 'playwright/test'
import axe from 'axe-core'
import type { Page } from 'playwright'

async function violations(page: Page) {
  await page.addScriptTag({ content: axe.source })
  return page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })).violations)
}

test('landing and both sample-workspace themes have no serious axe violations', async ({ browser }) => {
  const context = await browser.newContext({ bypassCSP: true })
  const page = await context.newPage()
  await page.goto('/')
  expect((await violations(page)).filter((item: { impact: string }) => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
  await page.goto('/demo')
  expect((await violations(page)).filter((item: { impact: string }) => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
  await page.getByRole('button', { name: 'Toggle color scheme' }).click()
  expect((await violations(page)).filter((item: { impact: string }) => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
  await context.close()
})

test('390px layout keeps the file action keyboard reachable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Choose a scan' })
  for (let index = 0; index < 12; index++) { if (await trigger.evaluate(element => document.activeElement === element)) break; await page.keyboard.press('Tab') }
  await expect(trigger).toBeFocused()
  await page.getByRole('link', { name: 'Try it with sample data' }).focus()
  await page.keyboard.press('Tab')
  await expect(page.locator('#download-link')).toBeFocused()
  await expect(page.locator('#file-input')).toHaveAttribute('tabindex', '-1')
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390)
  await context.close()
})

test('workspace add-page input is skipped by sequential keyboard focus', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Add pages' }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Close document' })).toBeFocused()
  await expect(page.locator('#add-input')).toHaveAttribute('tabindex', '-1')
})

test('demo startup reuses its measured fixture instead of rasterising it', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toDataURL
    ;(window as typeof window & { __demoRasterWrites: number }).__demoRasterWrites = 0
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      ;(window as typeof window & { __demoRasterWrites: number }).__demoRasterWrites += 1
      return original.apply(this, args as Parameters<typeof original>)
    }
  })
  await page.goto('/demo')
  await expect(page.getByRole('heading', { name: 'Field notes · sample page' })).toBeVisible()
  await expect(page.locator('#page-image')).toHaveAttribute('src', '/sample-scan.svg')
  expect(await page.evaluate(() => (window as typeof window & { __demoRasterWrites: number }).__demoRasterWrites)).toBe(0)
})

test('primary file action uses a native button and opens the file chooser', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('label.file-trigger')).toHaveCount(0)
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose a scan' }).click()
  await chooser
})

test('production routing returns the styled 404 document with an actual 404 status', async ({ request }) => {
  const response = await request.get('/no-such-route')
  expect(response.status()).toBe(404)
  expect(await response.text()).toContain('That page is not here.')
})

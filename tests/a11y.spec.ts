import { test, expect } from 'playwright/test'
import axe from 'axe-core'
import type { Page } from 'playwright'

async function violations(page: Page) {
  await page.addScriptTag({ content: axe.source })
  return page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })).violations)
}

test('landing and dark sample workspace have no serious axe violations', async ({ page }) => {
  await page.goto('/')
  expect((await violations(page)).filter((item: { impact: string }) => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Toggle color scheme' }).click()
  expect((await violations(page)).filter((item: { impact: string }) => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
})

test('390px layout keeps the file action keyboard reachable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/')
  const trigger = page.locator('.file-trigger')
  for (let index = 0; index < 12; index++) { if (await trigger.evaluate(element => document.activeElement === element)) break; await page.keyboard.press('Tab') }
  await expect(trigger).toBeFocused()
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390)
  await context.close()
})

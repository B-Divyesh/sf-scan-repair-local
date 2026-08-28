import { test, expect } from 'playwright/test'

test('@claim:demo-sandbox /demo loads a named sample and reset replaces it', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Field notes · sample page' })).toBeVisible()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByRole('heading', { name: 'Field notes · sample page' })).toBeVisible()
})

test('@claim:reversible-repair applies rotation to pixels and undo restores the prior page', async ({ page }) => {
  await page.goto('/demo')
  const image = page.locator('#page-image')
  await expect(image).toBeVisible()
  const before = await image.getAttribute('src')
  await page.getByRole('button', { name: 'Turn right' }).click()
  await page.getByRole('button', { name: 'Apply reversible repair' }).click()
  await expect(page.getByRole('button', { name: 'Undo last repair' })).toBeVisible()
  expect(await image.getAttribute('src')).not.toBe(before)
  await page.getByRole('button', { name: 'Undo last repair' }).click()
  await expect(image).toHaveAttribute('src', before!)
  await expect(image).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
})

test('@claim:markdown-export exports the sample text with its page reference', async ({ page }) => {
  await page.goto('/demo')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export Markdown' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('scan-repair-local.md')
  expect(await file.createReadStream().then(async stream => { const chunks: Buffer[] = []; for await (const chunk of stream) chunks.push(chunk); return Buffer.concat(chunks).toString('utf8') })).toContain('## Page 1')
})

test('@claim:local-processing keeps the demo document flow on this origin', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Turn right' }).click()
  await page.getByRole('button', { name: 'Apply reversible repair' }).click()
  await page.getByRole('button', { name: 'Export Markdown' }).click()
  expect(requests.every(url => new URL(url).origin === 'http://localhost:4173')).toBe(true)
})

test('@claim:pro-searchable-pdf exports the sample as a searchable PDF for a verified license', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:scan-repair-local', 'verified-demo-license')
    localStorage.setItem('sb_license_state:scan-repair-local:verified-demo-license', JSON.stringify({ valid: true, checked: Date.now() }))
  })
  await page.goto('/')
  await expect(page.getByText('Local Pro costs $19 once')).toBeVisible()
  await page.goto('/demo')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export searchable PDF/ }).click()
  expect((await download).suggestedFilename()).toBe('scan-repair-local-searchable.pdf')
})

test('@claim:offline-demo reloads the demo after the first visit without a network connection', async ({ page, context }) => {
  const errors: string[] = []
  const missing: string[] = []
  const failed: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', response => { if (response.status() === 404) missing.push(response.url()) })
  page.on('requestfailed', request => failed.push(`${request.url()} ${request.failure()?.errorText}`))
  await page.goto('/demo')
  await expect(page.getByRole('heading', { name: 'Field notes · sample page' })).toBeVisible()
  const serviceWorker = await page.evaluate(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const registration = await navigator.serviceWorker.getRegistration()
    const cache = await caches.open('scan-repair-local-v6'); const entries = await cache.keys()
    return { url: location.href, secure: isSecureContext, hasServiceWorker: 'serviceWorker' in navigator, controller: Boolean(navigator.serviceWorker?.controller), installing: registration?.installing?.state, waiting: registration?.waiting?.state, active: registration?.active?.state, caches: await caches.keys(), entries: entries.map(entry => entry.url) }
  })
  expect(serviceWorker).toMatchObject({ controller: true, active: 'activated' })
  expect(serviceWorker.entries.some(entry => entry.includes('/assets/index-'))).toBe(true)
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match('/demo')))).toBe(true)
  await expect.poll(() => page.evaluate(async () => {
    const urls = [...document.querySelectorAll<HTMLScriptElement>('script[src]')].map(script => script.src)
      .concat([...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(link => link.href))
    return Promise.all(urls.map(url => caches.match(url))).then(matches => matches.every(Boolean))
  })).toBe(true)
  await context.setOffline(true)
  await page.reload()
  expect({ errors, missing, failed }).toEqual({ errors: [], missing: [], failed: [] })
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Field notes · sample page' })).toBeVisible()
})

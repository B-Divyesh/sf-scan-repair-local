import { defineConfig } from 'playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  use: { baseURL: 'http://localhost:4173', headless: true },
  webServer: { command: 'npm run build:site && npm run serve:production', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI }
})

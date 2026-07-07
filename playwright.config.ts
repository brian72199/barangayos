import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  globalSetup: './e2e/global.setup.ts',
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:8080',
    storageState: 'playwright/.auth/user.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: process.env.CI
        ? 'node scripts/e2e-server.mjs'
        : 'npm run dev',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
})

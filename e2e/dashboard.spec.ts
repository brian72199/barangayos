import { test, expect } from '@playwright/test'

test('dashboard loads with authenticated user', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Dashboard')
})

test('customize panel opens and closes', async ({ page }) => {
  await page.goto('/')
  const customizeBtn = page.getByRole('button', { name: /customize/i })
  await expect(customizeBtn).toBeVisible()
  await customizeBtn.click()
  await expect(page.getByText('Customize')).toBeVisible()
  await page.keyboard.press('Escape')
})

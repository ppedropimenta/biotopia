import { expect, test } from '@playwright/test'

test.use({ locale: 'en-US' })

test('a visitor opens the demo tank from the landing page and can only read it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Open the demo tank' }).first().click()

  await expect(page.getByRole('heading', { level: 1, name: 'Demo blackwater' })).toBeVisible()
  await expect(page.getByRole('note')).toContainText('read-only')
  // Nothing to write with: no add buttons, no edit, no archive or delete.
  await expect(page.getByRole('link', { name: 'Add measurement' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete tank for good' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Log measurement' })).toHaveCount(0)

  // The rest of the demo reads the same way, from its own menu.
  const menu = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(menu.getByRole('link', { name: 'Maintenance' })).toHaveCount(0)
  await menu.getByRole('link', { name: 'Timeline' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Timeline' })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Edit/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Log maintenance' })).toHaveCount(0)
  await menu.getByRole('link', { name: 'Photos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Photos' })).toBeVisible()

  // The banner points to sign-up.
  await page.getByRole('note').getByRole('link', { name: 'Make my own' }).click()
  await expect(page).toHaveURL(/\/signup/)
})

test('the demo link on the sign in page and a private tank address behave for a visitor', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: /See the demo tank/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Demo blackwater' })).toBeVisible()

  // Any other tank is not open: the visitor is sent to log in.
  await page.goto('/tanks/00000000-0000-0000-0000-000000000000')
  await expect(page).toHaveURL(/\/login/)
})

test('in Portuguese the demo says the same, in Portuguese', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'PT', exact: true }).click()
  await page.getByRole('link', { name: 'Abrir o aquário demo' }).first().click()
  await expect(page.getByRole('note')).toContainText('somente leitura')
})

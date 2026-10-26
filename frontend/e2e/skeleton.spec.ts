import { expect, test } from '@playwright/test'

test.use({ locale: 'en-US' })

test('a visitor switches to Portuguese and opens the credits page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your aquarium’s logbook' })).toBeVisible()

  await page.getByLabel('Language').selectOption('pt-BR')
  await expect(page.getByRole('heading', { name: 'O diário do seu aquário' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')

  await page.getByRole('contentinfo').getByRole('link', { name: 'Créditos e licenças' }).click()
  await expect(page).toHaveURL(/\/credits$/)
  await expect(page.getByRole('heading', { name: 'Créditos e licenças' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Créditos e licenças' })).toBeVisible()
})

test.describe('with a Portuguese browser', () => {
  test.use({ locale: 'pt-BR' })

  test('the app starts in Portuguese', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'O diário do seu aquário' })).toBeVisible()
  })
})

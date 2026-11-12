import { expect, test } from '@playwright/test'

test.use({ locale: 'en-US' })

test('a visitor switches to Portuguese and opens the credits page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your tank over time.' })).toBeVisible()

  await page.getByRole('button', { name: 'PT', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seu aquário ao longo do tempo.' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.getByRole('button', { name: 'PT', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toHaveAttribute('aria-pressed', 'false')

  await page.getByRole('contentinfo').getByRole('link', { name: 'Créditos e licenças' }).click()
  await expect(page).toHaveURL(/\/credits$/)
  await expect(page.getByRole('heading', { name: 'Créditos e licenças' })).toBeVisible()
  for (const font of ['Source Serif 4', 'IBM Plex Mono', 'Caveat']) {
    await expect(page.getByRole('heading', { name: font })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: 'SIL Open Font Licence 1.1' })).toHaveCount(3)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Créditos e licenças' })).toBeVisible()
})

test('the landing page offers the demo tank, an account and a log in', async ({ page }) => {
  await page.goto('/')
  const main = page.getByRole('main')

  await main.getByRole('link', { name: 'or create an account' }).click()
  await expect(page).toHaveURL(/\/signup$/)

  await page.goBack()
  await page.getByRole('banner').getByRole('link', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goBack()
  await expect(main.getByRole('heading', { name: 'Open a real tank.' })).toBeVisible()
  await expect(main.getByRole('link', { name: 'Open the demo tank' })).toHaveCount(2)
  await expect(main.getByRole('heading', { name: 'Where the project is going' })).toBeVisible()
  await expect(main.getByRole('listitem').filter({ hasText: 'Ready' })).toHaveCount(1)
})

test.describe('with a Portuguese browser', () => {
  test.use({ locale: 'pt-BR' })

  test('the app starts in Portuguese', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Seu aquário ao longo do tempo.' })).toBeVisible()
  })
})

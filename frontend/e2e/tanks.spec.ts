import { expect, test } from '@playwright/test'
import { loggedInKeeper } from './keeper.ts'

test.use({ locale: 'en-US' })

test('a keeper adds a tank, finds it in the list and edits it, with numbers in their language', async ({ page }) => {
  await loggedInKeeper(page)

  // A new account has no tanks, and the empty list invites the first one.
  await expect(page.getByRole('heading', { name: 'No tanks yet' })).toBeVisible()
  await page.getByRole('link', { name: 'Add your first tank' }).click()

  // A name and a start date are needed before anything is sent.
  await page.getByRole('button', { name: 'Save tank' }).click()
  await expect(page.getByText('This is needed.')).toHaveCount(2)

  await page.getByLabel('Name').fill('Blackwater 120')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByLabel('Length (cm)').fill('80.5')
  await page.getByLabel('Net volume (liters)').fill('98.5')
  await page.getByLabel('Note').fill('Peat filter')
  await page.getByRole('button', { name: 'Save tank' }).click()

  await expect(page.getByRole('heading', { name: 'Blackwater 120' })).toBeVisible()
  await expect(page.getByText('Since March 1, 2025')).toBeVisible()
  await expect(page.getByText('Peat filter')).toBeVisible()

  // The list shows the tank, with its Net Volume as the figure.
  await page.getByRole('link', { name: 'Your tanks' }).first().click()
  const card = page.getByRole('link', { name: /Blackwater 120/ })
  await expect(card).toContainText('98.5')

  // In Brazilian Portuguese the same number is written with a decimal comma.
  await page.getByLabel('Language').selectOption('pt-BR')
  await expect(card).toContainText('98,5')

  // Editing shows the number the way it is typed in this language, and refuses the other notation.
  await card.click()
  await page.getByRole('link', { name: 'Editar aquário' }).click()
  await expect(page.getByLabel('Volume líquido (litros)')).toHaveValue('98,5')
  await page.getByLabel('Volume líquido (litros)').fill('101.5')
  await page.getByRole('button', { name: 'Salvar aquário' }).click()
  await expect(page.getByText('Digite um número maior que 0, com no máximo 2 casas decimais, como 80,5.')).toBeVisible()

  await page.getByLabel('Volume líquido (litros)').fill('101,5')
  await page.getByLabel('Nome').fill('Blackwater 125')
  await page.getByRole('button', { name: 'Salvar aquário' }).click()
  await expect(page.getByRole('heading', { name: 'Blackwater 125' })).toBeVisible()
  await expect(page.getByText('101,5')).toBeVisible()
  await expect(page.getByText('Desde 1 de março de 2025')).toBeVisible()
})

test('someone else’s tank looks like a tank that does not exist', async ({ page, browser }) => {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Add your first tank' }).click()
  await page.getByLabel('Name').fill('Private tank')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByRole('button', { name: 'Save tank' }).click()
  await expect(page.getByRole('heading', { name: 'Private tank' })).toBeVisible()
  const tankUrl = page.url()

  const other = await browser.newPage({ locale: 'en-US' })
  await loggedInKeeper(other)
  await other.goto(tankUrl)
  await expect(other.getByText('This tank does not exist.')).toBeVisible()
  await expect(other.getByText('Private tank')).toHaveCount(0)
  await other.close()
})

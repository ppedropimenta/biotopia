import { expect, test } from '@playwright/test'
import { choosePortuguese, loggedInKeeper } from './keeper.ts'

test.use({ locale: 'en-US' })

test('a keeper who is logged in sees the landing page in the public frame, with My tanks in the header', async ({ page }) => {
  await loggedInKeeper(page)

  await page.goto('/')
  const header = page.getByRole('banner')
  await expect(page.getByRole('heading', { name: 'Your tank over time.' })).toBeVisible()
  // No side menu (its Account link is part of it) and no Log in: only the way back to the tanks.
  await expect(page.getByRole('link', { name: 'Account', exact: true })).toHaveCount(0)
  await expect(header.getByRole('link', { name: 'Log in' })).toHaveCount(0)

  await header.getByRole('link', { name: 'My tanks' }).click()
  await expect(page).toHaveURL(/\/tanks$/)
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()
})

test('a keeper adds a tank, finds it in the list and edits it, with numbers in their language', async ({ page }) => {
  await loggedInKeeper(page)

  // A new account has no tanks, and the empty list invites the first one.
  await expect(page.getByRole('link', { name: 'Start a new plate' })).toBeVisible()
  await page.getByRole('link', { name: 'Start a new plate' }).click()

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
  await expect(page.getByText('March 1, 2025')).toBeVisible()
  await expect(page.getByText('98.5 L')).toBeVisible()
  await expect(page.getByText('Peat filter')).toBeVisible()
  // The plate says which one it is and how long the tank has been running, from the start date.
  await expect(page.getByRole('figure')).toContainText('Plate I')
  await expect(page.getByRole('figure')).toContainText(/\d+ weeks running/)

  // The list shows the tank, with its Net Volume as the figure.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'My tanks' }).click()
  const card = page.getByRole('link', { name: /Blackwater 120/ })
  await expect(card).toContainText('98.5')
  await expect(card).toContainText('Plate I')
  // Nothing was measured, so the three fixed values show a dash, never a zero, and ammonia is not NH₃.
  await expect(card).toContainText('Total ammonia')
  await expect(card.getByText('not measured yet')).toHaveCount(3)

  // In Brazilian Portuguese the same number is written with a decimal comma.
  await choosePortuguese(page)
  await expect(card).toContainText('98,5')

  // Editing shows the number the way it is typed in this language, and refuses the other notation.
  await card.click()
  await page.getByRole('link', { name: 'Editar', exact: true }).click()
  await expect(page.getByLabel('Volume líquido (litros)')).toHaveValue('98,5')
  await page.getByLabel('Volume líquido (litros)').fill('101.5')
  await page.getByRole('button', { name: 'Salvar aquário' }).click()
  await expect(page.getByText('Digite um número maior que 0, com no máximo 2 casas decimais, como 80,5.')).toBeVisible()

  await page.getByLabel('Volume líquido (litros)').fill('101,5')
  await page.getByLabel('Nome').fill('Blackwater 125')
  await page.getByRole('button', { name: 'Salvar aquário' }).click()
  await expect(page.getByRole('heading', { name: 'Blackwater 125' })).toBeVisible()
  await expect(page.getByText('101,5')).toBeVisible()
  await expect(page.getByText('1 de março de 2025')).toBeVisible()
  await expect(page.getByRole('figure')).toContainText(/Montado há \d+ semanas/)
})

test('someone else’s tank looks like a tank that does not exist', async ({ page, browser }) => {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Start a new plate' }).click()
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

import { expect, test } from '@playwright/test'
import { choosePortuguese, createTank, loggedInKeeper } from './keeper.ts'

test.use({ locale: 'en-US' })

test('a keeper who is logged in sees the landing page in the public frame, with My tanks in the header', async ({ page }) => {
  await loggedInKeeper(page)

  await page.goto('/')
  const header = page.getByRole('banner')
  await expect(page.getByRole('heading', { name: 'Your tank over time.' })).toBeVisible()
  // No side menu (its Account link is part of it) and no Log in: only the way back to the tanks.
  await expect(page.getByRole('link', { name: 'Account', exact: true })).toHaveCount(0)
  await expect(header.getByRole('link', { name: 'Log in' })).toHaveCount(0)
  // The language is chosen on the account page once logged in, so the header has no PT / EN.
  await expect(header.getByRole('button', { name: 'PT', exact: true })).toHaveCount(0)

  await header.getByRole('link', { name: 'My tanks' }).click()
  await expect(page).toHaveURL(/\/tanks$/)
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()
})

test('a keeper adds a tank, finds it in the list and edits it, with numbers in their language', async ({ page }) => {
  await loggedInKeeper(page)

  // A new account has no tanks, and the empty list invites the first one.
  await expect(page.getByRole('link', { name: 'Start a new plate' })).toBeVisible()
  // With no tank in view there is nothing to record into, so the side menu has no record buttons.
  await expect(page.getByRole('link', { name: 'Log measurement' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Start a new plate' }).click()

  // The plate of the new tank is there from the start, and a name and a start date are needed to go on.
  await expect(page.getByLabel('How the plate will look')).toContainText('Plate I')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('This is needed.')).toHaveCount(2)

  await page.getByLabel('Name').fill('Blackwater 120')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByRole('button', { name: 'Continue' }).click()

  // The size can be a common one or typed; the plate says the volume that comes from it, and that it is gross.
  await page.getByLabel('Length', { exact: true }).fill('80.5')
  await page.getByLabel('Width', { exact: true }).fill('35')
  await page.getByLabel('Height', { exact: true }).fill('45')
  await expect(page.getByLabel('How the plate will look')).toContainText('127 L')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Not knowing the net volume is an answer; knowing it asks for the number.
  await page.getByRole('button', { name: 'I know the net volume' }).click()
  await page.getByRole('textbox', { name: 'Net volume' }).fill('98.5')
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

  // Editing shows the number the way it is written in this language, and takes a decimal point as well.
  await card.click()
  await page.getByRole('link', { name: 'Editar', exact: true }).click()
  await page.getByRole('button', { name: /^Passo 3/ }).click()
  await expect(page.getByRole('textbox', { name: 'Volume líquido' })).toHaveValue('98,5')
  await page.getByRole('textbox', { name: 'Volume líquido' }).fill('101.5')
  await page.getByRole('button', { name: /^Passo 1/ }).click()
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
  await createTank(page, { name: 'Private tank' })
  await expect(page.getByRole('heading', { name: 'Private tank' })).toBeVisible()
  const tankUrl = page.url()

  const other = await browser.newPage({ locale: 'en-US' })
  await loggedInKeeper(other)
  await other.goto(tankUrl)
  await expect(other.getByText('This tank does not exist.')).toBeVisible()
  await expect(other.getByText('Private tank')).toHaveCount(0)
  await other.close()
})

test('a tank with no net volume uses the gross one, worked out from its size', async ({ page }) => {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Start a new plate' }).click()
  await page.getByLabel('Name').fill('Gross tank')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: /^120×40×50/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  // Not knowing is the default answer, so nothing more is asked.
  await expect(page.getByRole('button', { name: 'I do not: use the gross volume', pressed: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save tank' }).click()

  await expect(page.getByRole('heading', { name: 'Gross tank' })).toBeVisible()
  await expect(page.getByText('Gross volume', { exact: true })).toBeVisible()
  await expect(page.getByText('240 L', { exact: true })).toBeVisible()

  // A water change is worked out from it: 30% of 240 L.
  await page.getByRole('link', { name: 'Log maintenance' }).click()
  await page.getByLabel('Water replaced').fill('30')
  await expect(page.getByText('≈ 72 L of 240 L (gross volume)')).toBeVisible()
})

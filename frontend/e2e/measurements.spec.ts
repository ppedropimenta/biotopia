import { expect, test, type Locator, type Page } from '@playwright/test'
import { loggedInKeeper } from './keeper.ts'

test.use({ locale: 'en-US' })

async function keeperWithATank(page: Page) {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Start a new plate' }).click()
  await page.getByLabel('Name').fill('Water tests')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByRole('button', { name: 'Save tank' }).click()
  await expect(page.getByRole('heading', { name: 'Water tests' })).toBeVisible()
}

/** The grid with the latest value of each Parameter. */
const latestValues = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Latest measurement' }) })

/** A figure shown on its own, so '20' does not match the 20 in "2026". */
const figure = (section: Locator, value: string) => section.getByText(value, { exact: true })

test('a keeper records several measurements at once, sees the latest values, edits one and deletes one', async ({ page }) => {
  await keeperWithATank(page)

  // A tank with no measurements invites the first ones.
  await expect(latestValues(page)).toContainText('Nothing measured yet')
  await page.getByRole('link', { name: 'Log the first measurement' }).click()

  // Nothing is required, but an empty form records nothing.
  await page.getByRole('button', { name: 'Save measurements' }).click()
  await expect(page.getByText('Fill in at least one value.')).toBeVisible()

  // An impossible value is refused where it was typed, with the limits.
  await page.getByLabel('pH', { exact: true }).fill('72')
  await page.getByRole('button', { name: 'Save measurements' }).click()
  await expect(page.getByText('Enter a value from 0 to 14.')).toBeVisible()

  // Only the Parameters that were measured are filled; a 0 is a value. The moment is in the past.
  await page.getByLabel('pH', { exact: true }).fill('6.8')
  await page.getByLabel(/^Nitrate/).fill('20')
  await page.getByLabel(/^Nitrite/).fill('0')
  await page.getByLabel('When').fill('2026-01-10T08:30')
  await page.getByLabel('Note').fill('API kit')
  await page.getByRole('button', { name: 'Save measurements' }).click()

  await expect(page.getByRole('heading', { name: 'Water tests' })).toBeVisible()
  await expect(figure(latestValues(page), '6.8')).toBeVisible()
  await expect(figure(latestValues(page), '20')).toBeVisible()
  await expect(latestValues(page)).toContainText('Nitrite (NO₂)')
  await expect(latestValues(page)).toContainText('Measured Jan 10, 2026')
  await expect(latestValues(page)).not.toContainText('Temperature')
  await expect(page.getByText('API kit')).toBeVisible()

  // Later measurements take over the latest value of the Parameters it covers; the others stay.
  await page.getByRole('link', { name: 'Add measurement' }).click()
  await expect(page.getByRole('heading', { name: 'Record measurements' })).toBeVisible()
  await page.getByLabel(/^Nitrate/).fill('35')
  await page.getByRole('button', { name: 'Save measurements' }).click()
  await expect(figure(latestValues(page), '35')).toBeVisible()
  await expect(figure(latestValues(page), '6.8')).toBeVisible()

  // Each value says how it moved from the previous one of its own Parameter, in words as well as a mark.
  await expect(latestValues(page)).toContainText('Up 15 from the previous measurement')
  await expect(latestValues(page).getByText('▲ 15')).toBeVisible()
  await expect(latestValues(page)).toContainText('Another parameter')

  // Editing fixes a value.
  await page.getByRole('link', { name: /^Edit pH from/ }).click()
  await expect(page.getByLabel('Value')).toHaveValue('6.8')
  await page.getByLabel('Value').fill('71')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Enter a value from 0 to 14.')).toBeVisible()
  await page.getByLabel('Value').fill('7.1')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(figure(latestValues(page), '7.1')).toBeVisible()

  // Deleting the newest nitrate brings the earlier one back as the latest.
  await page.getByRole('link', { name: /^Edit Nitrate \(NO₃\) from/ }).first().click()
  await expect(page.getByLabel(/^Value/)).toHaveValue('35')
  await page.getByRole('button', { name: 'Delete this measurement' }).click()
  await page.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(page.getByRole('heading', { name: 'Water tests' })).toBeVisible()
  await expect(figure(latestValues(page), '35')).toHaveCount(0)
  await expect(figure(latestValues(page), '20')).toBeVisible()
  await expect(latestValues(page)).not.toContainText('from the previous measurement')

  // The tank list shows the latest pH on the tank's plate; temperature and total ammonia were never measured.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'My tanks' }).click()
  const plate = page.getByRole('link', { name: /Water tests/ })
  await expect(plate).toContainText('7.1')
  await expect(plate.getByText('not measured yet')).toHaveCount(2)
})

test('in Brazilian Portuguese the decimal comma is typed and shown, and the point is refused', async ({ page }) => {
  await keeperWithATank(page)
  await page.getByRole('button', { name: 'PT', exact: true }).click()
  await page.getByRole('link', { name: 'Registrar a primeira medição' }).click()

  await page.getByLabel('pH', { exact: true }).fill('6.8')
  await page.getByRole('button', { name: 'Salvar medições' }).click()
  await expect(page.getByText('Digite um número com no máximo 4 casas decimais, como 6,8.')).toBeVisible()

  await page.getByLabel('pH', { exact: true }).fill('6,8')
  await page.getByLabel(/^Temperatura/).fill('25,5')
  await page.getByRole('button', { name: 'Salvar medições' }).click()

  const latest = page.locator('section', { has: page.getByRole('heading', { name: 'Última medição' }) })
  await expect(figure(latest, '6,8')).toBeVisible()
  await expect(figure(latest, '25,5')).toBeVisible()
  await expect(latest).toContainText('Temperatura')
  await expect(latest).toContainText('°C')
})

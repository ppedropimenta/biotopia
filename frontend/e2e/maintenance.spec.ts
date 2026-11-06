import { expect, test } from '@playwright/test'
import { fillValue, loggedInKeeper } from './keeper.ts'

test.use({ locale: 'en-US' })

test('a keeper records a water change and other care, edits one, deletes one and sees the last water change', async ({ page }) => {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Start a new plate' }).click()
  await page.getByLabel('Name').fill('Care log')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByLabel('Net volume (liters)').fill('120')
  await page.getByRole('button', { name: 'Save tank' }).click()
  await expect(page.getByRole('heading', { name: 'Care log', level: 1 })).toBeVisible()

  // A tank with no maintenance has no diary on its page; the menu and a button lead to the log.
  await expect(page.getByRole('heading', { name: 'Maintenance diary' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Log maintenance' }).click()

  // A water change is the first choice and needs a percentage above 0 and at most 100.
  await expect(page.getByRole('heading', { name: 'Record maintenance', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Water change', pressed: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save maintenance' }).click()
  await expect(page.getByText('Enter the percentage of water replaced.')).toBeVisible()
  await page.getByLabel('Water replaced').fill('0')
  await page.getByRole('button', { name: 'Save maintenance' }).click()
  await expect(page.getByText('Enter a percentage above 0 and up to 100.')).toBeVisible()
  await page.getByLabel('Water replaced').fill('30')
  await page.getByLabel('Note').fill('RO water')
  await page.getByRole('button', { name: 'Save maintenance' }).click()

  // The timeline's journal shows it, with the liters worked out from the net volume.
  await expect(page.getByRole('heading', { name: 'Timeline', level: 1 })).toBeVisible()
  await expect(page.getByText('Water change · 30% of the water')).toBeVisible()
  await expect(page.getByText('RO water')).toBeVisible()
  await expect(page.getByText('36 L')).toBeVisible()

  // Other has no percentage and needs a note.
  await page.getByRole('link', { name: 'Log maintenance' }).click()
  await page.getByRole('button', { name: 'Water change', pressed: true }).click()
  await page.getByRole('button', { name: 'Other', pressed: false }).click()
  await expect(page.getByLabel('Water replaced')).toHaveCount(0)
  await page.getByRole('button', { name: 'Save maintenance' }).click()
  await expect(page.getByText('Say what you did.')).toBeVisible()
  await page.getByLabel('Note (what you did)').fill('Moved the heater')
  await page.getByRole('button', { name: 'Save maintenance' }).click()
  await expect(page.getByText('Moved the heater')).toBeVisible()

  // Newest first: the one recorded last is on top.
  const entries = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: /^Edit / }) })
  await expect(entries).toHaveCount(2)
  await expect(entries.first()).toContainText('Other')
  await expect(entries.last()).toContainText('Water change')

  // Editing fixes the percentage.
  await page.getByRole('link', { name: /^Edit Water change from/ }).click()
  await expect(page.getByRole('heading', { name: 'Edit maintenance', level: 1 })).toBeVisible()
  await expect(page.getByLabel('Water replaced')).toHaveValue('30')
  await page.getByLabel('Water replaced').fill('25')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Water change · 25% of the water')).toBeVisible()

  // The tank page has a diary of the newest entries, and the tank list tells when the last water change was.
  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(page.getByRole('heading', { name: 'Maintenance diary' })).toBeVisible()
  await expect(page.getByText('Water change · 25% of the water')).toBeVisible()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'My tanks' }).click()
  await expect(page.getByText('Last water change: 25% · today')).toBeVisible()

  // A measurement and the maintenance share the history, and the maintenance marks the chart.
  await page.getByRole('link', { name: /Care log/ }).click()
  await page.getByRole('link', { name: 'Log measurement' }).first().click()
  await fillValue(page, 'Nitrate', '20')
  await page.getByRole('button', { name: 'Save measurements' }).click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Timeline' }).click()
  await page.getByRole('button', { name: 'Chart' }).click()
  await expect(page.getByText(/^Water change, /)).toBeAttached()
  await page.getByRole('button', { name: 'Journal' }).click()
  const history = page.locator('main section ol > li')
  await expect(history).toHaveCount(3)
  await expect(history.nth(0)).toContainText('Nitrate (NO₃)')
  await expect(history.nth(0)).toContainText('20')
  await expect(history.nth(1)).toContainText('Moved the heater')
  await expect(history.nth(2)).toContainText('Water change')

  // Deleting removes only that entry.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'My tanks' }).click()
  await page.getByRole('link', { name: /Care log/ }).click()
  await page.getByRole('link', { name: 'All maintenance' }).click()
  await page.getByRole('link', { name: /^Edit Other from/ }).click()
  await page.getByRole('button', { name: 'Delete this maintenance' }).click()
  await page.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(page.getByText('Moved the heater')).toHaveCount(0)
  await expect(page.getByText('Water change · 25% of the water')).toBeVisible()
})

test('a keeper records a water change, a filter cleaning and a substrate cleaning in one go', async ({ page }) => {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Start a new plate' }).click()
  await page.getByLabel('Name').fill('Weekly care')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByLabel('Net volume (liters)').fill('100')
  await page.getByRole('button', { name: 'Save tank' }).click()
  await expect(page.getByRole('heading', { name: 'Weekly care', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Log maintenance' }).click()

  // At least one type is needed.
  await page.getByRole('button', { name: 'Water change', pressed: true }).click()
  await page.getByRole('button', { name: 'Save maintenance' }).click()
  await expect(page.getByText('Pick at least one thing that was done.')).toBeVisible()

  // Water change, filter and substrate together: the percentage is for the water change only.
  await page.getByRole('button', { name: 'Water change', pressed: false }).click()
  await page.getByRole('button', { name: 'Filter cleaning', pressed: false }).click()
  await page.getByRole('button', { name: 'Substrate cleaning', pressed: false }).click()
  await page.getByLabel('Water replaced').fill('30')
  await page.getByRole('button', { name: 'Save maintenance' }).click()

  const entries = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: /^Edit / }) })
  await expect(entries).toHaveCount(3)
  await expect(page.getByText('Water change · 30% of the water')).toBeVisible()
  await expect(page.getByRole('link', { name: /^Edit Filter cleaning from/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Edit Substrate cleaning from/ })).toBeVisible()
})

test('in Brazilian Portuguese the type names and the decimal comma are in Portuguese', async ({ page }) => {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Start a new plate' }).click()
  await page.getByLabel('Name').fill('Diário')
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByRole('button', { name: 'Save tank' }).click()
  await expect(page.getByRole('heading', { name: 'Diário', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'PT', exact: true }).click()

  await page.getByRole('link', { name: 'Registrar manutenção' }).click()
  await page.getByLabel('Água trocada').fill('12.5')
  await page.getByRole('button', { name: 'Salvar manutenção' }).click()
  await expect(page.getByText('Digite um número com no máximo 2 casas decimais, como 12,5.')).toBeVisible()
  await page.getByLabel('Água trocada').fill('12,5')
  await page.getByRole('button', { name: 'Salvar manutenção' }).click()
  await expect(page.getByText('Troca de água · 12,5% da água')).toBeVisible()
})

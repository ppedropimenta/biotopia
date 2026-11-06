import { expect, test, type Locator, type Page } from '@playwright/test'
import { fillValue, loggedInKeeper } from './keeper.ts'

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
  await fillValue(page, 'pH', '72')
  await page.getByRole('button', { name: 'Save measurements' }).click()
  await expect(page.getByText('Enter a value from 0 to 14.')).toBeVisible()

  // Only the Parameters that were measured are filled; a 0 is a value. The moment is in the past.
  await fillValue(page, 'pH', '6.8')
  await fillValue(page, 'Nitrate', '20')
  await fillValue(page, 'Nitrite', '0')
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
  await expect(page.getByRole('heading', { name: 'Log measurement', level: 1 })).toBeVisible()

  // Each tile shows the last value of its Parameter, dimmed; a Parameter never measured shows a dash.
  await expect(page.getByRole('button', { name: /^Nitrate/ })).toContainText('20')
  await expect(page.getByRole('button', { name: /^pH/ })).toContainText('6.8')
  await expect(page.getByRole('button', { name: /^Temperature/ })).toContainText('never measured')
  await expect(page.getByRole('button', { name: /^Total ammonia/ })).toContainText('never measured')

  // Touching a tile opens it with its last value and − and + buttons, which step by the Parameter's own step.
  await page.getByRole('button', { name: /^Nitrate/ }).click()
  await expect(page.getByText('last: 20 mg/L')).toBeVisible()
  await expect(page.getByRole('button', { name: /^(Increase|Decrease)/ })).toHaveCount(2)
  await page.getByRole('button', { name: 'Increase Nitrate (NO₃)' }).click()
  await expect(page.getByRole('textbox', { name: /^Nitrate/ })).toHaveValue('25')
  await page.getByRole('textbox', { name: /^Nitrate/ }).fill('')
  await fillValue(page, 'Temperature', '')
  await page.getByRole('button', { name: 'Increase Temperature' }).click()
  await expect(page.getByRole('textbox', { name: 'Temperature', exact: true })).toHaveValue('25.5')
  await page.getByRole('button', { name: 'Decrease Temperature' }).click()
  await page.getByRole('button', { name: 'Decrease Temperature' }).click()
  await expect(page.getByRole('textbox', { name: 'Temperature', exact: true })).toHaveValue('24.5')
  await page.getByRole('textbox', { name: 'Temperature', exact: true }).fill('')

  await fillValue(page, 'Nitrate', '35')
  await expect(page.getByText('1 measurement to save')).toBeVisible()
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

  // The tank list shows the latest pH on the tank's plate. Temperature and total ammonia were never measured, so the
  // plate shows the nitrite and nitrate that were, not a dash.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'My tanks' }).click()
  const plate = page.getByRole('link', { name: /Water tests/ })
  await expect(plate).toContainText('7.1')
  await expect(plate).toContainText('NO₂')
  await expect(plate).toContainText('NO₃')
  await expect(plate).not.toContainText('Temperature')
  await expect(plate.getByText('not measured yet')).toHaveCount(0)
})

test('in Brazilian Portuguese the decimal comma is typed and shown, and the point is refused', async ({ page }) => {
  await keeperWithATank(page)
  await page.getByRole('button', { name: 'PT', exact: true }).click()
  await page.getByRole('link', { name: 'Registrar a primeira medição' }).click()

  await fillValue(page, 'pH', '6.8')
  await page.getByRole('button', { name: 'Salvar medições' }).click()
  await expect(page.getByText('Digite um número com no máximo 4 casas decimais, como 6,8.')).toBeVisible()

  await fillValue(page, 'pH', '6,8')
  await fillValue(page, 'Temperatura', '25,5')
  await page.getByRole('button', { name: 'Aumentar Temperatura' }).click()
  await expect(page.getByRole('textbox', { name: /^Temperatura/ })).toHaveValue('26')
  await page.getByRole('textbox', { name: /^Temperatura/ }).fill('25,5')
  await page.getByRole('button', { name: 'Salvar medições' }).click()

  const latest = page.locator('section', { has: page.getByRole('heading', { name: 'Última medição' }) })
  await expect(figure(latest, '6,8')).toBeVisible()
  await expect(figure(latest, '25,5')).toBeVisible()
  await expect(latest).toContainText('Temperatura')
  await expect(latest).toContainText('°C')
})

/** A date-and-time field's text for a moment some days ago. */
function daysAgo(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T08:30`
}

async function record(page: Page, daysBack: number, values: Record<string, string>) {
  await page.getByRole('link', { name: 'Add measurement' }).click()
  // Wait for the form: until it replaces the tank page, a label such as Nitrate also matches that page's gauges.
  await expect(page.getByRole('heading', { name: 'Log measurement', level: 1 })).toBeVisible()
  for (const [label, value] of Object.entries(values)) await fillValue(page, label, value)
  await page.getByLabel('When').fill(daysAgo(daysBack))
  await page.getByRole('button', { name: 'Save measurements' }).click()
  await expect(page.getByRole('heading', { name: 'Water tests', level: 1 })).toBeVisible()
}

test('a keeper reads the water over time: a chart for one parameter at a time, a period to pick and a table', async ({ page }) => {
  await keeperWithATank(page)

  // No measurements: no chart to draw, and an invitation instead.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Timeline' }).click()
  await expect(page.getByRole('heading', { name: 'Timeline', level: 1 })).toBeVisible()
  await expect(page.getByText('Nothing measured yet.')).toBeVisible()

  await page.getByRole('link', { name: 'Log the first measurement' }).click()
  await fillValue(page, 'Nitrate', '5')
  await page.getByLabel('When').fill(daysAgo(200))
  await page.getByRole('button', { name: 'Save measurements' }).click()
  await record(page, 20, { Nitrate: '20', pH: '6.8' })
  await record(page, 3, { Nitrate: '35' })

  // The tank page has a small chart of the last 4 weeks, and a way to all of them.
  await expect(page.getByRole('heading', { name: 'Last 4 weeks' })).toBeVisible()
  await page.getByRole('link', { name: 'All charts' }).click()

  // 12 weeks is the default period: the measurement from 200 days ago is not in it. The chart shows one parameter
  // at a time, the first tile (pH) to begin with, and another tile swaps it.
  await expect(page.getByRole('button', { name: '12 wk' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('group', { name: /pH, over time, from 1 measurement date/ })).toBeVisible()
  await page.getByRole('button', { name: /^Nitrate/ }).click()
  const chart = page.getByRole('group', { name: /Nitrate \(NO₃\), over time, from 2 measurement dates/ })
  await expect(chart).toBeVisible()

  // The latest date is read out to begin with; the arrow keys walk back through the dates and Escape comes back.
  const readout = page.locator('[aria-live="polite"]')
  await expect(readout).toContainText('Latest measurement')
  await expect(readout).toContainText('Nitrate (NO₃) 35 mg/L')
  await chart.focus()
  await chart.press('ArrowLeft')
  await expect(readout).toContainText('Selected measurement')
  await expect(readout).toContainText('pH 6.8')
  await expect(readout).toContainText('Nitrate (NO₃) 20 mg/L')
  await chart.press('Escape')
  await expect(readout).toContainText('Latest measurement')

  // The same numbers as a table; the whole history brings the oldest value in.
  await page.getByRole('button', { name: 'Table' }).click()
  const table = page.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(3)
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page).toHaveURL(/period=all/)
  await expect(table.getByRole('row')).toHaveCount(4)
  await expect(table.getByRole('cell', { name: '5', exact: true })).toBeVisible()

  // Back to the chart, in Portuguese.
  await page.getByRole('button', { name: 'PT', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Linha do tempo', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Gráfico' }).click()
  await expect(page.getByRole('group', { name: /pH, ao longo do tempo, a partir de 1 data de medição/ })).toBeVisible()
})

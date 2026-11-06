import { expect, type Page } from '@playwright/test'
import { confirmationLink } from './mailbox.ts'

const password = 'correct horse battery'

/** Types a value into a Parameter's tile on the recording form: the tile is opened first, unless it is already open. */
export async function fillValue(page: Page, name: string, value: string) {
  const label = name === 'pH' ? 'pH' : new RegExp('^' + name)
  const input = page.getByRole('textbox', { name: label, exact: name === 'pH' })
  if (!(await input.isVisible())) await page.getByRole('button', { name: new RegExp('^' + name) }).click()
  await input.fill(value)
}

/** Switches the app to Portuguese from the account page and comes back to the screen the keeper was on. */
export async function choosePortuguese(page: Page) {
  await page.getByRole('link', { name: 'Account', exact: true }).click()
  await page.getByRole('button', { name: 'PT', exact: true }).click()
  await page.goBack()
}

/**
 * Fills in the new tank form from its first step to its last and saves it: the name and the start date, a size, and
 * the net volume when one is given (without it the tank has none and the gross volume is used).
 */
export async function createTank(page: Page, { name, netVolume }: { name: string; netVolume?: string }) {
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Start date').fill('2025-03-01')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  if (netVolume) {
    await page.getByRole('button', { name: 'I know the net volume' }).click()
    await page.getByRole('textbox', { name: 'Net volume' }).fill(netVolume)
  }
  await page.getByRole('button', { name: 'Save tank' }).click()
}

/** Signs up a new keeper, confirms the email and logs in, ending on their (empty) list of tanks. */
export async function loggedInKeeper(page: Page) {
  const address = `keeper-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`
  await page.goto('/signup')
  await page.getByLabel('Email').fill(address)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  await page.goto(await confirmationLink(address))
  await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible()
  await page.goto('/login')
  await page.getByLabel('Email').fill(address)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()
}

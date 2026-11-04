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

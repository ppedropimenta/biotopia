import { expect, type Page } from '@playwright/test'
import { confirmationLink } from './mailbox.ts'

const password = 'correct horse battery'

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

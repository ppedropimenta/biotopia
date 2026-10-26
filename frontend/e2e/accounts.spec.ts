import { expect, test, type Page } from '@playwright/test'
import { confirmationLink, resetLink } from './mailbox.ts'

test.use({ locale: 'en-US' })

const password = 'correct horse battery'

function newAddress() {
  return `fisher-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`
}

async function signUp(page: Page, address: string) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Create an account' }).click()
  await page.getByLabel('Email').fill(address)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
}

async function logIn(page: Page, address: string) {
  await page.getByLabel('Email').fill(address)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
}

test('a visitor signs up, confirms the email and logs in', async ({ page }) => {
  const address = newAddress()
  await signUp(page, address)

  // Before confirming, login is refused with a reason and a way to get the link again.
  await page.getByRole('banner').getByRole('link', { name: 'Log in' }).click()
  await logIn(page, address)
  await expect(page.getByText('Your email is not confirmed yet')).toBeVisible()
  await page.getByRole('button', { name: 'Send the link again' }).click()
  await expect(page.getByText('Sent again')).toBeVisible()

  // The newest link is the one that works; opening it confirms the account.
  await page.goto(await confirmationLink(address))
  await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible()

  await page.getByRole('link', { name: 'Log in' }).last().click()
  await logIn(page, address)
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()
  await expect(page.getByText(address)).toBeVisible()

  // The session lasts: a reload keeps the visitor logged in, and logging out ends it.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()
  await page.getByRole('banner').getByRole('button', { name: 'Log out' }).click()
  await page.goto('/tanks')
  await expect(page).toHaveURL(/\/login$/)
})

test('the language chosen in the app is saved on the account and restored on login', async ({ page }) => {
  const address = newAddress()
  await signUp(page, address)
  await page.goto(await confirmationLink(address))
  await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible()
  await page.getByRole('link', { name: 'Log in' }).last().click()
  await logIn(page, address)
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()

  await page.getByLabel('Language').selectOption('pt-BR')
  await expect(page.getByRole('heading', { name: 'Seus aquários' })).toBeVisible()
  await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()

  // A browser that remembers nothing: only the account can say which language this person chose.
  await page.evaluate(() => localStorage.clear())
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await logIn(page, address)
  await expect(page.getByRole('heading', { name: 'Seus aquários' })).toBeVisible()
})

test('someone who forgot the password gets a link, sets a new one, and the link works once', async ({ page }) => {
  const address = newAddress()
  const newPassword = 'a brand new passphrase'
  await signUp(page, address)
  await page.goto(await confirmationLink(address))
  await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible()

  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot your password?' }).click()
  await page.getByLabel('Email').fill(address)
  await page.getByRole('button', { name: 'Send the link' }).click()
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

  const link = await resetLink(address)
  await page.goto(link)
  await page.getByLabel('Password').fill('short')
  await page.getByRole('button', { name: 'Save password' }).click()
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible()
  await page.getByLabel('Password').fill(newPassword)
  await page.getByRole('button', { name: 'Save password' }).click()
  await expect(page.getByRole('heading', { name: 'Password changed' })).toBeVisible()

  // The old password is gone, the new one works.
  await page.getByRole('link', { name: 'Log in' }).last().click()
  await logIn(page, address)
  await expect(page.getByText('That email and password do not match.')).toBeVisible()
  await page.getByLabel('Password').fill(newPassword)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()

  // Opening the same link again gets a way to ask for a new one.
  await page.getByRole('banner').getByRole('button', { name: 'Log out' }).click()
  await page.goto(link)
  await page.getByLabel('Password').fill('yet another passphrase')
  await page.getByRole('button', { name: 'Save password' }).click()
  await expect(page.getByRole('heading', { name: 'This link does not work' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ask for a new link' })).toBeVisible()
})

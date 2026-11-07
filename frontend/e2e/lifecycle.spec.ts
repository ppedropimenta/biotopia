import { expect, test, type Page } from '@playwright/test'
import { createTank, loggedInKeeper } from './keeper.ts'

test.use({ locale: 'en-US' })

async function addTank(page: Page, name: string) {
  await page.goto('/tanks/new')
  await createTank(page, { name })
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

test('a keeper archives a tank, finds it apart from the running ones, restores it and deletes it', async ({ page }) => {
  await loggedInKeeper(page)
  await addTank(page, 'Old tank')

  await page.getByRole('button', { name: 'Archive tank' }).click()
  await page.getByRole('button', { name: 'Yes, continue' }).click()
  await expect(page.getByText(/Archived on/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Add measurement' })).toHaveCount(0)

  await page.goto('/tanks')
  const archived = page.getByRole('region', { name: 'Archived tanks' })
  await expect(archived.getByRole('link', { name: /Old tank/ })).toBeVisible()

  await archived.getByRole('link', { name: /Old tank/ }).click()
  await page.getByRole('button', { name: 'Restore tank' }).click()
  await expect(page.getByRole('link', { name: 'Add measurement' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete tank for good' }).click()
  await expect(page.getByText(/Every measurement, maintenance entry and photo/)).toBeVisible()
  await page.getByRole('button', { name: 'Yes, delete it' }).click()
  await expect(page.getByRole('heading', { name: 'Your tanks' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start a new plate' })).toBeVisible()
  await expect(page.getByText('Old tank')).toHaveCount(0)
})

test('a keeper deletes the account with the password and is sent to the log in screen', async ({ page }) => {
  await loggedInKeeper(page)
  await addTank(page, 'Gone soon')

  await page.getByRole('link', { name: 'Account' }).click()
  await page.getByRole('button', { name: 'Delete my account for good' }).click()
  await page.getByLabel('Your password').fill('wrong one')
  await page.getByRole('button', { name: 'Delete my account for good' }).click()
  await expect(page.getByText('That password does not match.')).toBeVisible()

  await page.getByLabel('Your password').fill('correct horse battery')
  await page.getByRole('button', { name: 'Delete my account for good' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('a browser still logged in to a deleted account lands on a working public page', async ({ page, browser }) => {
  const address = await loggedInKeeper(page)
  const other = await browser.newContext({ locale: 'en-US' })
  const otherPage = await other.newPage()
  await otherPage.goto('/login')
  await otherPage.getByLabel('Email').fill(address)
  await otherPage.getByLabel('Password').fill('correct horse battery')
  await otherPage.getByRole('button', { name: 'Log in' }).click()
  await expect(otherPage.getByRole('heading', { name: 'Your tanks' })).toBeVisible()

  await page.getByRole('link', { name: 'Account' }).click()
  await page.getByRole('button', { name: 'Delete my account for good' }).click()
  await page.getByLabel('Your password').fill('correct horse battery')
  await page.getByRole('button', { name: 'Delete my account for good' }).click()
  await expect(page).toHaveURL(/\/login/)

  await otherPage.reload()
  await expect(otherPage).toHaveURL(/\/login/)
  await expect(otherPage.getByRole('button', { name: 'Log in' })).toBeVisible()
  await other.close()
})

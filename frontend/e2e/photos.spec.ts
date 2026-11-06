import { expect, test } from '@playwright/test'
import { createTank, loggedInKeeper } from './keeper.ts'

test.use({ locale: 'en-US' })

/** A 1 x 1 PNG: the smallest real picture, enough to go through the upload. */
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

test('a keeper adds a photo, sees it everywhere the tank shows up, edits it and deletes it', async ({ page }) => {
  await loggedInKeeper(page)
  await page.getByRole('link', { name: 'Start a new plate' }).click()
  await createTank(page, { name: 'Photo tank' })
  await expect(page.getByRole('heading', { name: 'Photo tank', level: 1 })).toBeVisible()

  // No photos: no strip on the tank page, an invitation and an empty meter on the photos page.
  await expect(page.getByRole('heading', { name: 'Recent photos' })).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Photos' }).click()
  await expect(page.getByRole('heading', { name: 'Photos', level: 1 })).toBeVisible()
  await expect(page.getByText('No photos yet.')).toBeVisible()
  await expect(page.getByText('Using 0 KB of 200 MB of photo storage.')).toBeVisible()
  await page.getByRole('link', { name: 'Add the first photo' }).click()

  // Something that is not a picture is refused with a message, before anything is sent.
  await expect(page.getByRole('heading', { name: 'Add a photo', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Save photo' }).click()
  await expect(page.getByText('Choose a photo.')).toBeVisible()
  await page.getByLabel('Photo', { exact: true }).setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
  await page.getByRole('button', { name: 'Save photo' }).click()
  await expect(page.getByText('This is not a JPEG, PNG or WebP picture.')).toBeVisible()

  // A picture goes through, with a past date and a note.
  await page.getByLabel('Photo', { exact: true }).setInputFiles({ name: 'tank.png', mimeType: 'image/png', buffer: png })
  await page.getByLabel('When it was taken').fill('2026-01-10T08:30')
  await page.getByLabel('Note').fill('First plants in')
  await page.getByRole('button', { name: 'Save photo' }).click()

  await expect(page.getByRole('heading', { name: 'Photos', level: 1 })).toBeVisible()
  // The gallery groups by month and writes the day on each polaroid.
  await expect(page.getByRole('heading', { name: 'January 2026' })).toBeVisible()
  await expect(page.getByText('Jan 10, 2026', { exact: true })).toBeVisible()
  await expect(page.getByText('First plants in')).toBeVisible()
  await expect(page.getByText(/^Using \d+ KB of 200 MB/)).toBeVisible()
  await expect(page.getByRole('button', { name: /^Enlarge the photo from Jan 10, 2026/ })).toBeVisible()
  const picture = page.locator('main ul img')
  await expect(picture).toBeVisible()
  // The stored file is served, so the picture really loaded.
  await expect.poll(() => picture.evaluate((img) => (img as unknown as { naturalWidth: number }).naturalWidth)).toBe(1)

  // The tank page and the tank list show it.
  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(page.getByRole('heading', { name: 'Recent photos' })).toBeVisible()
  await expect(page.getByText('First plants in')).toBeVisible()
  // The overview plate shows the photo as the tank's cover, not the drawing.
  await expect(page.getByRole('figure').getByRole('img', { name: 'Latest photo of Photo tank' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'My tanks' }).click()
  await expect(page.getByRole('img', { name: 'Latest photo of Photo tank' })).toBeVisible()
  await expect(page.getByText('1 photo', { exact: true })).toBeVisible()

  // The journal on the timeline lists it.
  await page.getByRole('link', { name: /Photo tank/ }).click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Timeline' }).click()
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.getByRole('button', { name: /^Enlarge the photo from Jan 10, 2026/ }).click()
  // It opens larger, with a way to edit it; closing it leaves the timeline where it was.
  await expect(page.getByRole('dialog').getByRole('img', { name: /^Photo of Photo tank from Jan 10, 2026/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit this photo' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Timeline', level: 1 })).toBeVisible()

  // Editing fixes the note and the date; a date in the future is refused.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Photos' }).click()
  await page.getByRole('button', { name: /^Enlarge the photo from/ }).click()
  await page.getByRole('link', { name: 'Edit this photo' }).click()
  await expect(page.getByRole('heading', { name: 'Edit photo', level: 1 })).toBeVisible()
  await page.getByLabel('Note').fill('First plants in, rotala')
  await page.getByLabel('When it was taken').fill('2999-01-01T08:30')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('This moment has not happened yet.')).toBeVisible()
  await page.getByLabel('When it was taken').fill('2026-01-11T08:30')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Jan 11, 2026', { exact: true })).toBeVisible()
  await expect(page.getByText('First plants in, rotala')).toBeVisible()

  // Deleting frees the storage and brings the invitation back.
  await page.getByRole('button', { name: /^Enlarge the photo from/ }).click()
  await page.getByRole('link', { name: 'Edit this photo' }).click()
  await page.getByRole('button', { name: 'Delete this photo' }).click()
  await page.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(page.getByText('No photos yet.')).toBeVisible()
  await expect(page.getByText('Using 0 KB of 200 MB of photo storage.')).toBeVisible()
})

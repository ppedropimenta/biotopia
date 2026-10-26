import { readFileSync } from 'node:fs'
import { expect } from '@playwright/test'

const logPath = new URL('./.output/backend.log', import.meta.url)

/**
 * The newest confirmation link sent to an address, read from the backend log (see start-backend.mjs).
 * Waits briefly, because the email is written just after the response goes out.
 */
export async function confirmationLink(address: string): Promise<string> {
  let link: string | undefined
  await expect(async () => {
    const log = readFileSync(logPath, 'utf8')
    const links = log
      .split('Email to ')
      .filter((email) => email.startsWith(`${address}:`))
      .map((email) => email.match(/http\S+\/confirm\?token=[\w-]+/)?.[0])
    link = links.at(-1)
    expect(link).toBeDefined()
  }).toPass({ timeout: 10_000 })
  return link!
}

import { readFileSync } from 'node:fs'
import { expect } from '@playwright/test'

const logPath = new URL('./.output/backend.log', import.meta.url)

/**
 * The newest link at `path` sent to an address, read from the backend log (see start-backend.mjs).
 * Waits briefly, because the email is written just after the response goes out.
 */
async function newestLink(address: string, path: string): Promise<string> {
  let link: string | undefined
  await expect(async () => {
    const log = readFileSync(logPath, 'utf8')
    const links = log
      .split('Email to ')
      .filter((email) => email.startsWith(`${address}:`))
      .map((email) => email.match(new RegExp(String.raw`http\S+${path}\?token=[\w-]+`))?.[0])
    link = links.at(-1)
    expect(link).toBeDefined()
  }).toPass({ timeout: 10_000 })
  return link!
}

export const confirmationLink = (address: string) => newestLink(address, '/confirm')

export const resetLink = (address: string) => newestLink(address, '/reset-password')

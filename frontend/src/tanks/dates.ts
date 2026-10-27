import type { Language } from '../i18n/language'

/** A calendar day ("2025-03-01") written in the language's own way. It has no time, so no time zone applies. */
export function formatDay(isoDate: string, language: Language): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat(language, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}

const msPerDay = 24 * 60 * 60 * 1000

/**
 * The whole weeks a tank has been running on `today`, counted in calendar days (the start date has no time).
 * A tank that starts in the future has run 0.
 */
export function weeksRunning(startDate: string, today: Date): number {
  const [year, month, day] = startDate.split('-').map(Number)
  const days = (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(year, month - 1, day)) / msPerDay
  return Math.max(0, Math.floor(days / 7))
}

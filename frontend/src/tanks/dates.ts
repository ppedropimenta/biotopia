import type { Language } from '../i18n/language'

/** A calendar day ("2025-03-01") written in the language's own way. It has no time, so no time zone applies. */
export function formatDay(isoDate: string, language: Language): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat(language, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}

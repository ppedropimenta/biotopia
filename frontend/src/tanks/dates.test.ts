import { describe, expect, it } from 'vitest'
import { formatDay } from './dates'

describe('formatDay', () => {
  it('writes the day the way the language does', () => {
    expect(formatDay('2025-03-01', 'en')).toBe('March 1, 2025')
    expect(formatDay('2025-03-01', 'pt-BR')).toBe('1 de março de 2025')
  })

  it('never shifts the day with the time zone of the browser', () => {
    // A date without a time is a calendar day, not an instant: 2025-12-31 must stay the 31st everywhere.
    expect(formatDay('2025-12-31', 'en')).toBe('December 31, 2025')
  })
})

import { describe, expect, it } from 'vitest'
import { daysAgo, formatDay, weeksRunning } from './dates'

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

describe('weeksRunning', () => {
  const today = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day, 23, 30)
  }

  it('counts the whole weeks since the start date', () => {
    expect(weeksRunning('2026-03-14', today('2026-03-14'))).toBe(0)
    expect(weeksRunning('2026-03-14', today('2026-03-20'))).toBe(0)
    expect(weeksRunning('2026-03-14', today('2026-03-21'))).toBe(1)
    expect(weeksRunning('2026-03-14', today('2026-10-24'))).toBe(32)
  })

  it('counts calendar days, so the hour of the day does not matter', () => {
    expect(weeksRunning('2026-03-14', new Date(2026, 2, 21, 0, 5))).toBe(1)
    expect(weeksRunning('2026-03-14', new Date(2026, 2, 20, 23, 59))).toBe(0)
  })

  it('is 0 for a tank that starts in the future', () => {
    expect(weeksRunning('2026-12-01', today('2026-10-24'))).toBe(0)
  })
})

describe('daysAgo', () => {
  const now = new Date('2026-03-20T12:00:00Z')

  it('says how long ago an instant was, in the language', () => {
    expect(daysAgo('2026-03-20T08:00:00Z', now, 'en')).toBe('today')
    expect(daysAgo('2026-03-19T08:00:00Z', now, 'en')).toBe('yesterday')
    expect(daysAgo('2026-03-17T08:00:00Z', now, 'en')).toBe('3 days ago')
    expect(daysAgo('2026-03-17T08:00:00Z', now, 'pt-BR')).toBe('há 3 dias')
  })

  it('counts weeks and then months for longer spans', () => {
    expect(daysAgo('2026-03-01T12:00:00Z', now, 'en')).toBe('2 weeks ago')
    expect(daysAgo('2025-12-20T12:00:00Z', now, 'en')).toBe('3 months ago')
  })
})

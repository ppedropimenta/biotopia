import type { Language } from '../i18n/language'
import { formatNumber, parseNumber } from './numbers'

/** Sizes that many tanks have, in centimeters, to start from. Each one fills the three dimensions. */
export const commonSizes = [
  { length: 40, width: 25, height: 30 },
  { length: 60, width: 30, height: 36 },
  { length: 80, width: 35, height: 45 },
  { length: 100, width: 40, height: 50 },
  { length: 120, width: 40, height: 50 },
  { length: 150, width: 50, height: 55 },
] as const

/** How far the − and + buttons of a dimension move it, in centimeters, and the volume's in liters. */
export const dimensionStep = 5
export const volumeStep = 5

/**
 * What a field says after one step up or down: its number plus or minus `step`, never below one step. An empty or
 * unreadable field starts from `start`, so the first press already shows something sensible.
 */
export function stepped(text: string, direction: 1 | -1, step: number, start: number, language: Language): string {
  const read = parseNumber(text, language)
  const base = typeof read === 'number' && read > 0 ? read : start
  const next = Math.max(step, Math.round((base + direction * step) * 100) / 100)
  return formatNumber(next, language, { grouping: false })
}

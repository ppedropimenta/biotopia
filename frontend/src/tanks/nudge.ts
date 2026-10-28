import type { Language } from '../i18n/language'
import { valueDecimals, type Parameter, type ParameterCode } from './measurements'
import { formatNumber, parseNumber } from './numbers'

/** The Parameters that move in whole steps, with the step and a usual value to start from when nothing is known. */
const steppers: Partial<Record<ParameterCode, { step: number; start: number }>> = {
  temperature: { step: 0.5, start: 25 },
  gh: { step: 1, start: 0 },
  kh: { step: 1, start: 0 },
}

export const nudgeable = (code: ParameterCode) => code in steppers

/**
 * The field's text moved one step up (1) or down (-1). It starts from what is typed, else from the last value,
 * else from a usual one, and stays inside the Parameter's limits. The text is written for the language.
 */
export function nudge(text: string, direction: 1 | -1, parameter: Parameter, last: number | null, language: Language): string {
  const { step, start } = steppers[parameter.code] ?? { step: 1, start: 0 }
  const typed = parseNumber(text, language)
  const base = typeof typed === 'number' ? typed : (last ?? start)
  const factor = 10 ** valueDecimals
  const moved = Math.round((base + direction * step) * factor) / factor
  const value = Math.min(parameter.max, Math.max(parameter.min, moved))
  return formatNumber(value, language, { grouping: false, maxDecimals: valueDecimals })
}

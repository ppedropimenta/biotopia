import type { Language } from '../i18n/language'
import { valueDecimals, type Parameter, type ParameterCode } from './measurements'
import { formatNumber, parseNumber } from './numbers'

/** The step of each Parameter and a usual value to start from when nothing is known. */
const steppers: Record<ParameterCode, { step: number; start: number }> = {
  temperature: { step: 0.5, start: 25 },
  ph: { step: 0.1, start: 7 },
  gh: { step: 1, start: 0 },
  kh: { step: 1, start: 0 },
  total_ammonia: { step: 0.25, start: 0 },
  nitrite: { step: 0.1, start: 0 },
  nitrate: { step: 5, start: 0 },
  phosphate: { step: 0.5, start: 0 },
  tds: { step: 10, start: 0 },
  iron: { step: 0.1, start: 0 },
  potassium: { step: 1, start: 0 },
}

/** The Parameters whose single-value form (editing one measurement) has − and + buttons; the recording grid has them for all. */
const nudgeableCodes: readonly ParameterCode[] = ['temperature', 'gh', 'kh']

export const nudgeable = (code: ParameterCode) => nudgeableCodes.includes(code)

/**
 * The field's text moved one step up (1) or down (-1). It starts from what is typed, else from the last value,
 * else from a usual one, and stays inside the Parameter's limits. The text is written for the language.
 */
export function nudge(text: string, direction: 1 | -1, parameter: Parameter, last: number | null, language: Language): string {
  const { step, start } = steppers[parameter.code]
  const typed = parseNumber(text)
  const base = typeof typed === 'number' ? typed : (last ?? start)
  const factor = 10 ** valueDecimals
  const moved = Math.round((base + direction * step) * factor) / factor
  const value = Math.min(parameter.max, Math.max(parameter.min, moved))
  return formatNumber(value, language, { grouping: false, maxDecimals: valueDecimals })
}

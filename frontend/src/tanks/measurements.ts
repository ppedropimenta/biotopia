import { ApiError } from '../auth/api'
import type { Language } from '../i18n/language'
import { parseNumber } from './numbers'

/** The codes the API uses for Parameters. The names shown for them are in the translation files. */
export type ParameterCode =
  | 'temperature'
  | 'ph'
  | 'gh'
  | 'kh'
  | 'total_ammonia'
  | 'nitrite'
  | 'nitrate'
  | 'phosphate'
  | 'conductivity'
  | 'iron'
  | 'potassium'

/** A Parameter as the API lists it: its unit and the plausibility bounds. The API owns these numbers. */
export type Parameter = { code: ParameterCode; unit: string; min: number; max: number }

export type Measurement = {
  id: string
  parameter: ParameterCode
  value: number
  measuredAt: string
  note: string | null
}

/** What the API takes for several Measurements at one moment. A null moment means now, by the server's clock. */
export type NewMeasurements = {
  measuredAt: string | null
  note: string | null
  values: Partial<Record<ParameterCode, number>>
}

export type MeasurementChange = { value: number; measuredAt: string; note: string | null }

/** The recording form as typed: every value is text. `moment` is a date-and-time field's text, local time. */
export type RecordForm = {
  values: Partial<Record<ParameterCode, string>>
  moment: string
  /** False while `moment` is still the prefilled "now": the request then leaves it out. */
  momentChanged: boolean
  note: string
}

export type EditForm = { value: string; moment: string; note: string }

export type ErrorKey =
  | 'measurements.errors.number_invalid'
  | 'measurements.errors.out_of_range'
  | 'measurements.errors.values_required'
  | 'measurements.errors.moment_invalid'
  | 'measurements.errors.in_future'
  | 'measurements.errors.note_too_long'
  | 'measurements.errors.not_found'
  | 'measurements.errors.generic'

/** What to say and where: under a Parameter's field, under the moment or note, or for the whole form. */
export type FormErrors = Partial<Record<ParameterCode | 'value' | 'moment' | 'note' | 'general', ErrorKey>>

/** The decimals the API keeps for a value: enough for a photometer's 0.001 mg/L. */
export const valueDecimals = 4

function hasAtMostValueDecimals(value: number): boolean {
  const scaled = value * 10 ** valueDecimals
  return Math.abs(scaled - Math.round(scaled)) < 1e-6
}

/** The number typed for one Parameter, or what is wrong with it. An empty field is `null`: left out. */
function readValue(text: string, parameter: Parameter, language: Language): number | null | ErrorKey {
  const value = parseNumber(text, language)
  if (value === null) return null
  if (value === 'invalid' || !hasAtMostValueDecimals(value)) return 'measurements.errors.number_invalid'
  if (value < parameter.min || value > parameter.max) return 'measurements.errors.out_of_range'
  return value
}

/** A date-and-time field's text as an instant, or null when it is not a date and time. */
export function readMoment(text: string): string | null {
  const date = new Date(text)
  return text === '' || Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const cleanNote = (note: string) => (note.trim() === '' ? null : note.trim())

/** The request for what was typed, or the problems to show first. Nothing is sent for a Parameter left empty. */
export function toNewMeasurements(
  form: RecordForm,
  parameters: Parameter[],
  language: Language,
): { request: NewMeasurements } | { errors: FormErrors } {
  const errors: FormErrors = {}
  const values: Partial<Record<ParameterCode, number>> = {}
  for (const parameter of parameters) {
    const value = readValue(form.values[parameter.code] ?? '', parameter, language)
    if (typeof value === 'string') errors[parameter.code] = value
    else if (value !== null) values[parameter.code] = value
  }

  let measuredAt: string | null = null
  if (form.momentChanged) {
    measuredAt = readMoment(form.moment)
    if (measuredAt === null) errors.moment = 'measurements.errors.moment_invalid'
  }

  if (Object.keys(errors).length === 0 && Object.keys(values).length === 0) {
    errors.general = 'measurements.errors.values_required'
  }
  if (Object.keys(errors).length > 0) return { errors }
  return { request: { measuredAt, note: cleanNote(form.note), values } }
}

/** The request for an edit of one Measurement. An edit always carries its moment. */
export function toChange(
  form: EditForm,
  parameter: Parameter,
  language: Language,
): { change: MeasurementChange } | { errors: FormErrors } {
  const errors: FormErrors = {}
  const value = readValue(form.value, parameter, language)
  if (value === null) errors.value = 'measurements.errors.number_invalid'
  else if (typeof value === 'string') errors.value = value

  const measuredAt = readMoment(form.moment)
  if (measuredAt === null) errors.moment = 'measurements.errors.moment_invalid'

  if (Object.keys(errors).length > 0 || typeof value !== 'number' || measuredAt === null) return { errors }
  return { change: { value, measuredAt, note: cleanNote(form.note) } }
}

/** An instant as a date-and-time field wants it ("2026-01-10T08:30"), in the browser's own time zone. */
export function toLocalInput(instant: string): string {
  const date = new Date(instant)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`
}

/** An instant written for the language, in the person's own time zone (the browser's, unless one is given). */
export function formatMoment(instant: string, language: Language, timeZone?: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(
    new Date(instant),
  )
}

/** Measurements recorded together: one moment, one note. */
export type MomentGroup = { measuredAt: string; note: string | null; items: Measurement[] }

/** Groups a newest-first list by moment and note, keeping the order. */
export function groupByMoment(measurements: Measurement[]): MomentGroup[] {
  const groups: MomentGroup[] = []
  for (const measurement of measurements) {
    const group = groups.find((g) => g.measuredAt === measurement.measuredAt && g.note === measurement.note)
    if (group) group.items.push(measurement)
    else groups.push({ measuredAt: measurement.measuredAt, note: measurement.note, items: [measurement] })
  }
  return groups
}

const fieldCodes: Record<string, ErrorKey> = {
  out_of_range: 'measurements.errors.out_of_range',
  invalid: 'measurements.errors.number_invalid',
  unknown_parameter: 'measurements.errors.generic',
  required: 'measurements.errors.number_invalid',
}

/** Turns the API's stable codes into message keys, so every message is in the language the person chose. */
export function describeMeasurementError(error: unknown): FormErrors {
  if (!(error instanceof ApiError)) return { general: 'measurements.errors.generic' }
  if (error.code === 'tank_not_found' || error.code === 'measurement_not_found') {
    return { general: 'measurements.errors.not_found' }
  }

  if (error.code === 'validation_failed') {
    const errors: FormErrors = {}
    for (const [field, code] of Object.entries(error.fields)) {
      if (field.startsWith('values.')) {
        errors[field.slice('values.'.length) as ParameterCode] = fieldCodes[code] ?? 'measurements.errors.generic'
      } else if (field === 'value') errors.value = fieldCodes[code] ?? 'measurements.errors.generic'
      else if (field === 'measuredAt') {
        errors.moment = code === 'in_future' ? 'measurements.errors.in_future' : 'measurements.errors.moment_invalid'
      } else if (field === 'note') errors.note = 'measurements.errors.note_too_long'
      else if (field === 'values') errors.general = 'measurements.errors.values_required'
    }
    if (Object.keys(errors).length > 0) return errors
  }
  return { general: 'measurements.errors.generic' }
}

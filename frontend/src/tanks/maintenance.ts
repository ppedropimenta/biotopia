import { ApiError } from '../auth/api'
import type { StampTone } from '../components/ui/Stamp'
import { cleanNote, readMoment } from './measurements'
import { parseNumber } from './numbers'

/** The codes the API uses for the kinds of Maintenance. The names shown for them are in the translation files. */
export const maintenanceTypes = [
  'water_change',
  'top_up',
  'filter_cleaning',
  'fertilizing',
  'pruning',
  'substrate_cleaning',
  'other',
] as const

export type MaintenanceType = (typeof maintenanceTypes)[number]

/** The colour of a type's stamp: the same in the log, on the tank page and later on the charts. */
export const stampTones: Record<MaintenanceType, StampTone> = {
  water_change: 'neon',
  top_up: 'neon',
  filter_cleaning: 'cardinal',
  fertilizing: 'forest',
  pruning: 'forest',
  substrate_cleaning: 'ochre',
  other: 'muted',
}

export type Maintenance = {
  id: string
  type: MaintenanceType
  /** Only a Water Change has one. */
  percent: number | null
  performedAt: string
  note: string | null
}

/** What the API takes to record or edit one Maintenance. A null moment means now, by the server's clock. */
export type MaintenanceDetails = {
  type: MaintenanceType
  percent: number | null
  performedAt: string | null
  note: string | null
}

/**
 * The form as typed: every value is text. `moment` is a date-and-time field's text, local time. A new record can
 * have several `types` (one record each); an edit has exactly one.
 */
export type MaintenanceForm = {
  types: MaintenanceType[]
  percent: string
  moment: string
  /** False while `moment` is still the prefilled one: the request then keeps the moment it had (none, when new). */
  momentChanged: boolean
  note: string
}

export type ErrorKey =
  | 'maintenance.errors.type_required'
  | 'maintenance.errors.percent_required'
  | 'maintenance.errors.percent_out_of_range'
  | 'maintenance.errors.number_invalid'
  | 'maintenance.errors.note_required'
  | 'maintenance.errors.note_too_long'
  | 'maintenance.errors.moment_invalid'
  | 'maintenance.errors.in_future'
  | 'maintenance.errors.not_found'
  | 'maintenance.errors.archived'
  | 'maintenance.errors.generic'

export type FormErrors = Partial<Record<'type' | 'percent' | 'moment' | 'note' | 'general', ErrorKey>>

/** The decimals the API keeps for a percentage. */
const percentDecimals = 2

/** The liters a typed percentage comes to, while it is a valid percentage and the tank's volume is known. */
export function litersOfText(text: string, netVolumeLiters: number | null): number | null {
  if (netVolumeLiters === null) return null
  const percent = readPercent(text)
  return typeof percent === 'number' ? litersOf(percent, netVolumeLiters) : null
}

function readPercent(text: string): number | ErrorKey {
  const value = parseNumber(text)
  if (value === null) return 'maintenance.errors.percent_required'
  if (value === 'invalid' || Math.abs(value * 10 ** percentDecimals - Math.round(value * 10 ** percentDecimals)) > 1e-6) {
    return 'maintenance.errors.number_invalid'
  }
  return value > 0 && value <= 100 ? value : 'maintenance.errors.percent_out_of_range'
}

/**
 * The requests for what was typed, one for each type picked, or the problems to show first. `keptMoment` is the
 * moment to send when the field was left alone: null for a new record (the server uses now, the same one for all
 * of them), the instant it already has for an edit. The note goes on Other when it is picked, because Other needs
 * it, and otherwise on the first record, so a diary does not repeat it.
 */
export function toDetails(
  form: MaintenanceForm,
  keptMoment: string | null,
): { details: MaintenanceDetails[] } | { errors: FormErrors } {
  const errors: FormErrors = {}
  // The order of the type list, whatever order they were picked in.
  const types = maintenanceTypes.filter((type) => form.types.includes(type))
  if (types.length === 0) errors.type = 'maintenance.errors.type_required'

  let percent: number | null = null
  if (types.includes('water_change')) {
    const read = readPercent(form.percent)
    if (typeof read === 'string') errors.percent = read
    else percent = read
  }

  const note = cleanNote(form.note)
  if (types.includes('other') && note === null) errors.note = 'maintenance.errors.note_required'

  let performedAt = keptMoment
  if (form.momentChanged) {
    performedAt = readMoment(form.moment)
    if (performedAt === null) errors.moment = 'maintenance.errors.moment_invalid'
  }

  if (Object.keys(errors).length > 0) return { errors }
  const noteGoesOn = types.includes('other') ? 'other' : types[0]
  return {
    details: types.map((type) => ({
      type,
      percent: type === 'water_change' ? percent : null,
      performedAt,
      note: type === noteGoesOn ? note : null,
    })),
  }
}

const fieldCodes: Record<string, ErrorKey> = {
  percent_required: 'maintenance.errors.percent_required',
  percent_out_of_range: 'maintenance.errors.percent_out_of_range',
  percent_invalid: 'maintenance.errors.number_invalid',
}

/** Turns the API's stable codes into message keys, so every message is in the language the person chose. */
export function describeMaintenanceError(error: unknown): FormErrors {
  if (!(error instanceof ApiError)) return { general: 'maintenance.errors.generic' }
  if (error.code === 'tank_archived') return { general: 'maintenance.errors.archived' }
  if (error.code === 'tank_not_found' || error.code === 'maintenance_not_found') {
    return { general: 'maintenance.errors.not_found' }
  }

  if (error.code === 'validation_failed') {
    const errors: FormErrors = {}
    const { percent, performedAt, note } = error.fields
    if (percent) errors.percent = fieldCodes[`percent_${percent}`] ?? 'maintenance.errors.generic'
    if (performedAt) {
      errors.moment = performedAt === 'in_future' ? 'maintenance.errors.in_future' : 'maintenance.errors.moment_invalid'
    }
    if (note) errors.note = note === 'too_long' ? 'maintenance.errors.note_too_long' : 'maintenance.errors.note_required'
    if (Object.keys(errors).length > 0) return errors
  }
  return { general: 'maintenance.errors.generic' }
}

/** The water a percentage of the Net Volume is, in whole liters. */
export function litersOf(percent: number, netVolumeLiters: number): number {
  return Math.round((percent / 100) * netVolumeLiters)
}

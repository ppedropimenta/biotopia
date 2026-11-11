import { ApiError } from '../auth/api'
import type { Language } from '../i18n/language'
import { formatNumber, parseNumber } from './numbers'
import type { Tank, TankDetails } from './types'

/** The form as typed: every field is text, because that is what a person edits. */
export type TankForm = {
  name: string
  startDate: string
  lengthCm: string
  widthCm: string
  heightCm: string
  netVolumeLiters: string
  note: string
}

export const emptyForm: TankForm = {
  name: '',
  startDate: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  netVolumeLiters: '',
  note: '',
}

export type ErrorKey =
  | 'tanks.errors.required'
  | 'tanks.errors.number_invalid'
  | 'tanks.errors.name_too_long'
  | 'tanks.errors.note_too_long'
  | 'tanks.errors.not_found'
  | 'tanks.errors.archived'
  | 'tanks.errors.generic'

/** What to say and where: a message under a field, or one for the whole form. */
export type FormErrors = Partial<Record<keyof TankForm | 'general', ErrorKey>>

const numberFields = ['lengthCm', 'widthCm', 'heightCm', 'netVolumeLiters'] as const

/** The largest value each field takes. These match the API's limits (TankDetails.java), so a refusal shows up here first. */
const largest = { lengthCm: 10_000, widthCm: 10_000, heightCm: 10_000, netVolumeLiters: 1_000_000 }

/** Above 0, within the limit and with at most two decimals, as the API requires. */
function isAcceptable(value: number, field: (typeof numberFields)[number]): boolean {
  const hundredths = value * 100
  return value > 0 && value <= largest[field] && Math.abs(hundredths - Math.round(hundredths)) < 1e-6
}

/** The request for what was typed, or the problems to show first: a number that is not one, a missing name. */
export function toDetails(form: TankForm): { details: TankDetails } | { errors: FormErrors } {
  const errors: FormErrors = {}
  if (form.name.trim() === '') errors.name = 'tanks.errors.required'
  if (form.startDate === '') errors.startDate = 'tanks.errors.required'

  const numbers = {} as Record<(typeof numberFields)[number], number | null>
  for (const field of numberFields) {
    const value = parseNumber(form[field])
    if (value === 'invalid' || (value !== null && !isAcceptable(value, field))) errors[field] = 'tanks.errors.number_invalid'
    else numbers[field] = value
  }
  if (Object.keys(errors).length > 0) return { errors }

  return {
    details: {
      name: form.name,
      startDate: form.startDate,
      ...numbers,
      note: form.note.trim() === '' ? null : form.note,
    },
  }
}

/** A saved Tank as form text. Numbers are written without thousands separators, which the parser refuses. */
export function formFromTank(tank: Tank, language: Language): TankForm {
  const text = (value: number | null) => (value === null ? '' : formatNumber(value, language, { grouping: false }))
  return {
    name: tank.name,
    startDate: tank.startDate,
    lengthCm: text(tank.lengthCm),
    widthCm: text(tank.widthCm),
    heightCm: text(tank.heightCm),
    netVolumeLiters: text(tank.netVolumeLiters),
    note: tank.note ?? '',
  }
}

/** Turns the API's stable codes into message keys, so every message is in the language the person chose. */
export function describeTankError(error: unknown): FormErrors {
  if (!(error instanceof ApiError)) return { general: 'tanks.errors.generic' }
  if (error.code === 'tank_archived') return { general: 'tanks.errors.archived' }
  if (error.code === 'tank_not_found') return { general: 'tanks.errors.not_found' }

  if (error.code === 'validation_failed') {
    const errors: FormErrors = {}
    if (error.fields.name) errors.name = error.fields.name === 'too_long' ? 'tanks.errors.name_too_long' : 'tanks.errors.required'
    if (error.fields.startDate) errors.startDate = 'tanks.errors.required'
    for (const field of numberFields) {
      if (error.fields[field]) errors[field] = 'tanks.errors.number_invalid'
    }
    if (error.fields.note) errors.note = 'tanks.errors.note_too_long'
    if (Object.keys(errors).length > 0) return errors
  }
  return { general: 'tanks.errors.generic' }
}

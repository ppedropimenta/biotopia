import { ApiError } from './api'

export type ErrorKey =
  | 'auth.errors.invalid_credentials'
  | 'auth.errors.email_taken'
  | 'auth.errors.email_invalid'
  | 'auth.errors.password_too_short'
  | 'auth.errors.password_too_long'
  | 'auth.errors.password_personal'
  | 'auth.errors.login_incomplete'
  | 'auth.errors.too_many_requests'
  | 'auth.errors.generic'

/** What to say and where: a message under one field, or one for the whole form. */
export type FormErrors = { email?: ErrorKey; password?: ErrorKey; general?: ErrorKey }

/**
 * Turns the API's stable codes into message keys. The API never sends text, so every message is in the
 * language the person has chosen.
 */
export function describeError(error: unknown, form: 'signup' | 'login' | 'reset'): FormErrors {
  if (!(error instanceof ApiError)) return { general: 'auth.errors.generic' }

  if (error.code === 'invalid_credentials') return { general: 'auth.errors.invalid_credentials' }
  if (error.code === 'too_many_requests') return { general: 'auth.errors.too_many_requests' }
  if (error.code === 'email_taken') return { email: 'auth.errors.email_taken' }

  if (error.code === 'validation_failed') {
    // At login a field problem only means something was left empty; the details help only at sign-up.
    if (form === 'login') return { general: 'auth.errors.login_incomplete' }
    const errors: FormErrors = {}
    if (error.fields.email) errors.email = 'auth.errors.email_invalid'
    if (error.fields.password === 'too_long') errors.password = 'auth.errors.password_too_long'
    else if (error.fields.password === 'personal') errors.password = 'auth.errors.password_personal'
    else if (error.fields.password) errors.password = 'auth.errors.password_too_short'
    return Object.keys(errors).length > 0 ? errors : { general: 'auth.errors.generic' }
  }

  return { general: 'auth.errors.generic' }
}

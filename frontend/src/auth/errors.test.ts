import { describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { describeError } from './errors'

describe('describeError', () => {
  it('puts sign-up field problems under their fields', () => {
    const error = new ApiError(400, 'validation_failed', { email: 'invalid', password: 'too_short' })

    expect(describeError(error, 'signup')).toEqual({
      email: 'auth.errors.email_invalid',
      password: 'auth.errors.password_too_short',
    })
  })

  it('tells a too long password from a too short one', () => {
    const error = new ApiError(400, 'validation_failed', { password: 'too_long' })

    expect(describeError(error, 'signup')).toEqual({ password: 'auth.errors.password_too_long' })
  })

  it('explains a password problem when choosing a new one, like at sign-up', () => {
    const tooShort = new ApiError(400, 'validation_failed', { password: 'too_short' })
    const tooLong = new ApiError(400, 'validation_failed', { password: 'too_long' })

    expect(describeError(tooShort, 'reset')).toEqual({ password: 'auth.errors.password_too_short' })
    expect(describeError(tooLong, 'reset')).toEqual({ password: 'auth.errors.password_too_long' })
  })

  it('puts a bad address under the email field when asking for a reset link', () => {
    const error = new ApiError(400, 'validation_failed', { email: 'invalid' })

    expect(describeError(error, 'reset')).toEqual({ email: 'auth.errors.email_invalid' })
  })

  it('puts a taken email under the email field', () => {
    expect(describeError(new ApiError(409, 'email_taken'), 'signup')).toEqual({ email: 'auth.errors.email_taken' })
  })

  it('treats any field problem at login as something left empty', () => {
    const error = new ApiError(400, 'validation_failed', { email: 'invalid' })

    expect(describeError(error, 'login')).toEqual({ general: 'auth.errors.login_incomplete' })
  })

  it('says wrong credentials once for the whole form', () => {
    expect(describeError(new ApiError(401, 'invalid_credentials'), 'login')).toEqual({
      general: 'auth.errors.invalid_credentials',
    })
  })

  it('says to wait when the server refuses too many requests, in every form', () => {
    for (const form of ['signup', 'login', 'reset'] as const) {
      expect(describeError(new ApiError(429, 'too_many_requests'), form)).toEqual({
        general: 'auth.errors.too_many_requests',
      })
    }
  })

  it('falls back to a generic message for anything unexpected', () => {
    expect(describeError(new TypeError('network down'), 'login')).toEqual({ general: 'auth.errors.generic' })
    expect(describeError(new ApiError(500, 'unknown'), 'signup')).toEqual({ general: 'auth.errors.generic' })
  })
})

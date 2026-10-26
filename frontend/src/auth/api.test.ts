import { describe, expect, it } from 'vitest'
import { readCookie } from './api'

describe('readCookie', () => {
  it('finds a cookie among several', () => {
    expect(readCookie('a=1; XSRF-TOKEN=abc-123; b=2', 'XSRF-TOKEN')).toBe('abc-123')
  })

  it('keeps an equals sign inside the value', () => {
    expect(readCookie('XSRF-TOKEN=ab==', 'XSRF-TOKEN')).toBe('ab==')
  })

  it('does not mistake a longer name for the one asked', () => {
    expect(readCookie('OLD-XSRF-TOKEN=nope', 'XSRF-TOKEN')).toBeNull()
  })

  it('answers null when there are no cookies', () => {
    expect(readCookie('', 'XSRF-TOKEN')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { stepped } from './sizes'

describe('stepped', () => {
  it('moves a number by the step in either direction, in the language of the field', () => {
    expect(stepped('80', 1, 5, 80, 'en')).toBe('85')
    expect(stepped('80,5', -1, 5, 80, 'pt-BR')).toBe('75,5')
  })

  it('starts from the given value when the field is empty or unreadable', () => {
    expect(stepped('', 1, 5, 80, 'en')).toBe('85')
    expect(stepped('abc', -1, 5, 80, 'en')).toBe('75')
  })

  it('never goes below one step', () => {
    expect(stepped('5', -1, 5, 80, 'en')).toBe('5')
  })
})

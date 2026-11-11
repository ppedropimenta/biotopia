import { describe, expect, it } from 'vitest'
import { nudge, nudgeable } from './nudge'
import type { Parameter } from './measurements'

const temperature: Parameter = { code: 'temperature', unit: '°C', min: 0, max: 45 }
const gh: Parameter = { code: 'gh', unit: '°dH', min: 0, max: 100 }

describe('nudge', () => {
  it('moves the typed value by one step, written the way the language writes it', () => {
    expect(nudge('25,5', 1, temperature, null, 'pt-BR')).toBe('26')
    expect(nudge('25.5', -1, temperature, null, 'en')).toBe('25')
    expect(nudge('25', 1, temperature, null, 'pt-BR')).toBe('25,5')
  })

  it('starts from the last value when the field is empty', () => {
    expect(nudge('', 1, temperature, 26.5, 'en')).toBe('27')
    expect(nudge('', -1, gh, 6, 'en')).toBe('5')
  })

  it('starts from a usual value when the field is empty and there is no last one', () => {
    expect(nudge('', 1, temperature, null, 'en')).toBe('25.5')
    expect(nudge('', 1, gh, null, 'en')).toBe('1')
  })

  it('has a step of its own for every Parameter', () => {
    const ph: Parameter = { code: 'ph', unit: '', min: 0, max: 14 }
    const nitrate: Parameter = { code: 'nitrate', unit: 'mg/L', min: 0, max: 1000 }
    expect(nudge('', 1, ph, null, 'en')).toBe('7.1')
    expect(nudge('6,3', -1, ph, null, 'pt-BR')).toBe('6,2')
    expect(nudge('30', 1, nitrate, null, 'en')).toBe('35')
  })

  it('treats a value that is not a number as empty', () => {
    expect(nudge('abc', 1, gh, 4, 'en')).toBe('5')
    expect(nudge('1.5.0', 1, gh, 4, 'pt-BR')).toBe('5')
  })

  it('stays inside the limits of the Parameter', () => {
    expect(nudge('0', -1, gh, null, 'en')).toBe('0')
    expect(nudge('45', 1, temperature, null, 'en')).toBe('45')
  })

  it('does not show floating point noise', () => {
    expect(nudge('0.1', 1, { ...temperature, code: 'temperature' }, null, 'en')).toBe('0.6')
  })
})

describe('nudgeable', () => {
  it('is only temperature, GH and KH', () => {
    expect(nudgeable('temperature')).toBe(true)
    expect(nudgeable('gh')).toBe(true)
    expect(nudgeable('kh')).toBe(true)
    expect(nudgeable('ph')).toBe(false)
    expect(nudgeable('nitrate')).toBe(false)
  })
})

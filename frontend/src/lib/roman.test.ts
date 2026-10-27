import { describe, expect, it } from 'vitest'
import { roman } from './roman'

describe('roman', () => {
  it('writes the numbers a list of plates reaches', () => {
    expect([1, 2, 3, 4, 5, 9, 14, 40, 90, 400, 1994].map(roman)).toEqual(['I', 'II', 'III', 'IV', 'V', 'IX', 'XIV', 'XL', 'XC', 'CD', 'MCMXCIV'])
  })

  it('never goes below I', () => {
    expect(roman(0)).toBe('I')
    expect(roman(-3)).toBe('I')
  })
})

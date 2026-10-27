import { describe, expect, it } from 'vitest'
import { rangeStatus, scaleLinear } from './ranges'

describe('rangeStatus', () => {
  it('tells below, within and above, with both ends inside', () => {
    expect(rangeStatus(24.9, [25, 29])).toBe('below')
    expect(rangeStatus(25, [25, 29])).toBe('within')
    expect(rangeStatus(29, [25, 29])).toBe('within')
    expect(rangeStatus(29.5, [25, 29])).toBe('above')
  })

  it('accepts a range of a single point', () => {
    expect(rangeStatus(0, [0, 0])).toBe('within')
    expect(rangeStatus(0.25, [0, 0])).toBe('above')
  })
})

describe('scaleLinear', () => {
  it('maps the domain onto the range', () => {
    const x = scaleLinear([0, 10], [0, 100])
    expect(x(0)).toBe(0)
    expect(x(5)).toBe(50)
    expect(x(10)).toBe(100)
  })

  it('goes past the range unless told to clamp', () => {
    expect(scaleLinear([0, 10], [0, 100])(12)).toBe(120)
    expect(scaleLinear([0, 10], [0, 100], true)(12)).toBe(100)
    expect(scaleLinear([0, 10], [20, 4], true)(-3)).toBe(20)
  })

  it('does not divide by zero on a domain of a single point', () => {
    expect(Number.isFinite(scaleLinear([3, 3], [0, 100])(3))).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { tankArt, tankDrawing } from './illustrations'

describe('tankDrawing', () => {
  it('takes the drawings in turn by plate number, so neighbouring plates differ', () => {
    const drawings = [1, 2, 3].map(tankDrawing)

    expect(new Set(drawings).size).toBe(Object.keys(tankArt).length)
    expect(tankDrawing(4)).toBe(tankDrawing(1))
  })

  it('always gives a drawing that exists', () => {
    for (const number of [null, 1, 2, 3, 4, 50]) {
      expect(Object.keys(tankArt)).toContain(tankDrawing(number))
    }
  })

  it('gives the first drawing to a tank with no plate number', () => {
    expect(tankDrawing(null)).toBe(tankDrawing(1))
  })
})

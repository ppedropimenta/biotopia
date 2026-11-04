import { describe, expect, it } from 'vitest'
import type { Measurement, ParameterCode } from './measurements'
import { hasRoomInLastRow, plateNumber, plateValues } from './plates'

const measurement = (parameter: ParameterCode, value: number): Measurement => ({
  id: `${parameter}-1`,
  parameter,
  value,
  measuredAt: '2026-01-10T08:30:00Z',
  note: null,
})

describe('plateValues', () => {
  it('shows pH, temperature and total ammonia, in that order, when all three were measured', () => {
    const latest = [
      measurement('temperature', 25.5),
      measurement('total_ammonia', 0.25),
      measurement('ph', 6.8),
    ]

    expect(plateValues(latest).map((v) => v.parameter)).toEqual(['ph', 'temperature', 'total_ammonia'])
    expect(plateValues(latest).map((v) => v.value)).toEqual([6.8, 25.5, 0.25])
  })

  it('lets another Parameter take the place of a main one that was never measured', () => {
    const latest = [measurement('ph', 6.8), measurement('temperature', 25.5), measurement('nitrate', 10)]

    expect(plateValues(latest).map((v) => v.parameter)).toEqual(['ph', 'temperature', 'nitrate'])
    expect(plateValues(latest).map((v) => v.value)).toEqual([6.8, 25.5, 10])
  })

  it('shows only the main Parameters when they were all measured, however many others were', () => {
    const latest = [
      measurement('nitrate', 10),
      measurement('gh', 4),
      measurement('ph', 6.8),
      measurement('temperature', 25.5),
      measurement('total_ammonia', 0),
    ]

    expect(plateValues(latest).map((v) => v.parameter)).toEqual(['ph', 'temperature', 'total_ammonia'])
  })

  it('prefers the nitrogen cycle among the others', () => {
    const latest = [measurement('gh', 4), measurement('nitrate', 10), measurement('nitrite', 0), measurement('kh', 1)]

    expect(plateValues(latest).map((v) => v.parameter)).toEqual(['nitrite', 'nitrate', 'gh'])
  })

  it('fills the empty places with the main Parameters, with null, not zero', () => {
    expect(plateValues([measurement('ph', 6.8)]).map((v) => v.value)).toEqual([6.8, null, null])
    expect(plateValues([measurement('nitrate', 10)]).map((v) => [v.parameter, v.value])).toEqual([
      ['ph', null],
      ['temperature', null],
      ['nitrate', 10],
    ])
    expect(plateValues([]).map((v) => [v.parameter, v.value])).toEqual([
      ['ph', null],
      ['temperature', null],
      ['total_ammonia', null],
    ])
  })

  it('keeps a measured 0 as 0', () => {
    expect(plateValues([measurement('total_ammonia', 0)]).map((v) => v.value)).toEqual([null, null, 0])
  })
})

describe('plateNumber', () => {
  const tanks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('is the tank’s place in the creation-ordered list, counting from 1', () => {
    expect(plateNumber(tanks, 'a')).toBe(1)
    expect(plateNumber(tanks, 'c')).toBe(3)
  })

  it('is null for a tank that is not in the list', () => {
    expect(plateNumber(tanks, 'z')).toBeNull()
  })
})

describe('hasRoomInLastRow', () => {
  it('is true when the last row is not full', () => {
    expect(hasRoomInLastRow(1, 3)).toBe(true)
    expect(hasRoomInLastRow(2, 3)).toBe(true)
    expect(hasRoomInLastRow(4, 3)).toBe(true)
    expect(hasRoomInLastRow(3, 2)).toBe(true)
  })

  it('is false when every row is full, whatever the number of columns', () => {
    expect(hasRoomInLastRow(3, 3)).toBe(false)
    expect(hasRoomInLastRow(6, 3)).toBe(false)
    expect(hasRoomInLastRow(4, 2)).toBe(false)
    expect(hasRoomInLastRow(5, 1)).toBe(false)
  })

  it('is false until the columns are known', () => {
    expect(hasRoomInLastRow(2, null)).toBe(false)
  })
})

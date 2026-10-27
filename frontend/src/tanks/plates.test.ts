import { describe, expect, it } from 'vitest'
import type { Measurement, ParameterCode } from './measurements'
import { plateValues } from './plates'

const measurement = (parameter: ParameterCode, value: number): Measurement => ({
  id: `${parameter}-1`,
  parameter,
  value,
  measuredAt: '2026-01-10T08:30:00Z',
  note: null,
})

describe('plateValues', () => {
  it('always gives pH, temperature and total ammonia, in that order', () => {
    const latest = [
      measurement('temperature', 25.5),
      measurement('total_ammonia', 0.25),
      measurement('ph', 6.8),
    ]

    expect(plateValues(latest).map((v) => v.parameter)).toEqual(['ph', 'temperature', 'total_ammonia'])
    expect(plateValues(latest).map((v) => v.value)).toEqual([6.8, 25.5, 0.25])
  })

  it('leaves out every other Parameter, however many were measured', () => {
    const latest = [measurement('nitrate', 10), measurement('gh', 4), measurement('ph', 6.8)]

    expect(plateValues(latest).map((v) => v.parameter)).toEqual(['ph', 'temperature', 'total_ammonia'])
  })

  it('gives null, not zero, for one that was never measured', () => {
    expect(plateValues([measurement('ph', 6.8)]).map((v) => v.value)).toEqual([6.8, null, null])
    expect(plateValues([]).map((v) => v.value)).toEqual([null, null, null])
  })

  it('keeps a measured 0 as 0', () => {
    expect(plateValues([measurement('total_ammonia', 0)]).map((v) => v.value)).toEqual([null, null, 0])
  })
})

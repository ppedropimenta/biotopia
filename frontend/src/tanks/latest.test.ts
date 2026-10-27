import { describe, expect, it } from 'vitest'
import { changeBetween, latestValues } from './latest'
import type { Measurement, Parameter, ParameterCode } from './measurements'

const parameters: Parameter[] = [
  { code: 'temperature', unit: '°C', min: 0, max: 45 },
  { code: 'ph', unit: '', min: 0, max: 14 },
  { code: 'nitrate', unit: 'mg/L', min: 0, max: 1000 },
]

let next = 0
const measurement = (parameter: ParameterCode, value: number, measuredAt: string): Measurement => ({
  id: `m${next++}`,
  parameter,
  value,
  measuredAt,
  note: null,
})

describe('changeBetween', () => {
  it('says up, down or same, with how much', () => {
    expect(changeBetween(25, 26.5)).toEqual({ direction: 'up', amount: 1.5 })
    expect(changeBetween(10, 4)).toEqual({ direction: 'down', amount: 6 })
    expect(changeBetween(6.8, 6.8)).toEqual({ direction: 'same', amount: 0 })
  })

  it('does not show floating point noise', () => {
    expect(changeBetween(6.8, 7.1)).toEqual({ direction: 'up', amount: 0.3 })
  })

  it('treats a difference below what the API keeps as no change', () => {
    expect(changeBetween(1, 1.00001)).toEqual({ direction: 'same', amount: 0 })
  })
})

describe('latestValues', () => {
  it('has one entry per Parameter ever measured, in the order of the Parameter list', () => {
    const newest = measurement('nitrate', 20, '2026-01-10T08:30:00Z')
    const ph = measurement('ph', 6.8, '2026-01-09T08:30:00Z')
    const temperature = measurement('temperature', 25, '2026-01-08T08:30:00Z')

    const result = latestValues(parameters, [newest, ph, temperature], [newest, ph, temperature])

    expect(result.map((v) => v.measurement.parameter)).toEqual(['temperature', 'ph', 'nitrate'])
    expect(result.map((v) => v.parameter.unit)).toEqual(['°C', '', 'mg/L'])
  })

  it('leaves out a Parameter that was never measured', () => {
    const ph = measurement('ph', 6.8, '2026-01-09T08:30:00Z')

    expect(latestValues(parameters, [ph], [ph]).map((v) => v.measurement.parameter)).toEqual(['ph'])
    expect(latestValues(parameters, [], [])).toEqual([])
  })

  it('compares each latest value with the previous Measurement of the same Parameter only', () => {
    const phNow = measurement('ph', 7.1, '2026-01-10T08:30:00Z')
    const nitrate = measurement('nitrate', 35, '2026-01-09T08:30:00Z')
    const phBefore = measurement('ph', 6.8, '2026-01-08T08:30:00Z')
    const nitrateBefore = measurement('nitrate', 40, '2026-01-07T08:30:00Z')
    const history = [phNow, nitrate, phBefore, nitrateBefore]

    const result = latestValues(parameters, [phNow, nitrate], history)

    expect(result.find((v) => v.measurement.parameter === 'ph')?.change).toEqual({ direction: 'up', amount: 0.3 })
    expect(result.find((v) => v.measurement.parameter === 'nitrate')?.change).toEqual({ direction: 'down', amount: 5 })
  })

  it('has no change for a Parameter measured only once', () => {
    const ph = measurement('ph', 6.8, '2026-01-09T08:30:00Z')

    expect(latestValues(parameters, [ph], [ph])[0].change).toBeNull()
  })

  it('has no change when the latest value is not in the history it was given', () => {
    const ph = measurement('ph', 6.8, '2026-01-09T08:30:00Z')
    const old = measurement('ph', 6.5, '2026-01-01T08:30:00Z')

    expect(latestValues(parameters, [ph], [old])[0].change).toBeNull()
  })
})

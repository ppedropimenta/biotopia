import { describe, expect, it } from 'vitest'
import type { Measurement, Parameter, ParameterCode } from './measurements'
import { buildPanels, busiestPanel, momentsOf, niceScale, periodStart, recentSeries, timeRange, timeTicks } from './series'

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

const now = new Date('2026-03-01T12:00:00Z')

describe('periodStart', () => {
  it('counts back from now, and has no start for the whole history', () => {
    expect(periodStart('w4', now)).toEqual(new Date('2026-02-01T12:00:00Z'))
    expect(periodStart('w12', now)).toEqual(new Date('2025-12-07T12:00:00Z'))
    expect(periodStart('m6', now)).toEqual(new Date('2025-09-01T12:00:00Z'))
    expect(periodStart('all', now)).toBeNull()
  })
})

describe('buildPanels', () => {
  const history = [
    measurement('nitrate', 40, '2026-02-20T10:00:00Z'),
    measurement('ph', 6.8, '2026-02-20T10:00:00Z'),
    measurement('nitrate', 20, '2026-02-10T10:00:00Z'),
    measurement('nitrate', 5, '2025-10-01T10:00:00Z'),
  ]

  it('makes one panel per measured Parameter, in the order of the Parameter list, points oldest first', () => {
    const panels = buildPanels(history, parameters, null)
    expect(panels.map((p) => p.parameter)).toEqual(['ph', 'nitrate'])
    expect(panels[1].points.map((p) => p.value)).toEqual([5, 20, 40])
  })

  it('keeps only the points from the start of the period on, and drops a Parameter left with none', () => {
    const panels = buildPanels(history, parameters, new Date('2026-02-01T00:00:00Z'))
    expect(panels[1].points.map((p) => p.value)).toEqual([20, 40])
    expect(buildPanels(history, parameters, new Date('2026-02-25T00:00:00Z'))).toEqual([])
  })

  it('gives each panel a scale that holds its points', () => {
    for (const panel of buildPanels(history, parameters, null)) {
      for (const point of panel.points) {
        expect(point.value).toBeGreaterThanOrEqual(panel.domain[0])
        expect(point.value).toBeLessThanOrEqual(panel.domain[1])
      }
    }
  })
})

describe('niceScale', () => {
  it('rounds the ends to round numbers and ticks between them', () => {
    expect(niceScale([5, 40])).toEqual({ domain: [0, 40], ticks: [0, 10, 20, 30, 40] })
    expect(niceScale([6.8, 7.4])).toEqual({ domain: [6.8, 7.4], ticks: [6.8, 7, 7.2, 7.4] })
  })

  it('does not go below zero: values in the API are never negative', () => {
    expect(niceScale([0.2]).domain[0]).toBeGreaterThanOrEqual(0)
  })

  it('gives a single value, or only zeros, a scale with room around it', () => {
    const single = niceScale([7])
    expect(single.domain[0]).toBeLessThan(7)
    expect(single.domain[1]).toBeGreaterThan(7)
    expect(niceScale([0, 0]).domain[0]).toBe(0)
    expect(niceScale([0, 0]).domain[1]).toBeGreaterThan(0)
  })

  it('has no floating point noise in the ticks', () => {
    expect(niceScale([0.1, 0.5]).ticks).toEqual([0.1, 0.2, 0.3, 0.4, 0.5])
  })
})

describe('timeTicks', () => {
  it('spreads evenly from the start to the end', () => {
    expect(timeTicks(0, 400, 5)).toEqual([0, 100, 200, 300, 400])
  })

  it('is a single tick when the period is a single instant', () => {
    expect(timeTicks(10, 10, 5)).toEqual([10])
  })
})

describe('recentSeries', () => {
  it('lists the newest values of one Parameter, oldest first', () => {
    const history = [
      measurement('ph', 7.2, '2026-02-20T10:00:00Z'),
      measurement('nitrate', 40, '2026-02-19T10:00:00Z'),
      measurement('ph', 7.0, '2026-02-10T10:00:00Z'),
      measurement('ph', 6.8, '2026-02-01T10:00:00Z'),
    ]
    expect(recentSeries(history, 'ph', 2)).toEqual([7.0, 7.2])
    expect(recentSeries(history, 'temperature', 5)).toEqual([])
  })
})

describe('timeRange', () => {
  const panels = buildPanels([measurement('ph', 7, '2026-02-10T10:00:00Z')], parameters, null)

  it('runs from the start of the period to now', () => {
    const from = new Date('2026-02-01T00:00:00Z')
    expect(timeRange(panels, from, now)).toEqual([from.getTime(), now.getTime()])
  })

  it('starts at the oldest point for the whole history', () => {
    expect(timeRange(panels, null, now)[0]).toBe(new Date('2026-02-10T10:00:00Z').getTime())
  })

  it('is at least a day long, so one point has a place', () => {
    const justNow = [measurement('ph', 7, '2026-03-01T12:00:00Z')]
    const [start, end] = timeRange(buildPanels(justNow, parameters, null), null, now)
    expect(end - start).toBe(24 * 60 * 60 * 1000)
  })
})

describe('momentsOf', () => {
  it('lists each moment once, oldest first', () => {
    const history = [
      measurement('ph', 7, '2026-02-20T10:00:00Z'),
      measurement('nitrate', 4, '2026-02-20T10:00:00Z'),
      measurement('ph', 7.1, '2026-02-10T10:00:00Z'),
    ]
    expect(momentsOf(buildPanels(history, parameters, null))).toEqual([
      new Date('2026-02-10T10:00:00Z').getTime(),
      new Date('2026-02-20T10:00:00Z').getTime(),
    ])
  })
})

describe('busiestPanel', () => {
  it('picks the Parameter with the most points, the first one on a tie', () => {
    const history = [
      measurement('ph', 7, '2026-02-20T10:00:00Z'),
      measurement('nitrate', 4, '2026-02-20T10:00:00Z'),
      measurement('nitrate', 5, '2026-02-10T10:00:00Z'),
      measurement('ph', 7.1, '2026-02-05T10:00:00Z'),
    ]
    expect(busiestPanel(buildPanels(history, parameters, null))?.parameter).toBe('ph')
    expect(busiestPanel(buildPanels(history.slice(0, 3), parameters, null))?.parameter).toBe('nitrate')
    expect(busiestPanel([])).toBeUndefined()
  })
})

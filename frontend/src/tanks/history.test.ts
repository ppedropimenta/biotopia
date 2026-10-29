import { describe, expect, it } from 'vitest'
import { buildHistory, markersIn } from './history'
import type { Maintenance } from './maintenance'
import type { Measurement } from './measurements'

let next = 0
const measurement = (measuredAt: string, parameter: Measurement['parameter'] = 'nitrate'): Measurement => ({
  id: `m${next++}`,
  parameter,
  value: 10,
  measuredAt,
  note: null,
})
const care = (performedAt: string, type: Maintenance['type'] = 'water_change'): Maintenance => ({
  id: `c${next++}`,
  type,
  percent: type === 'water_change' ? 30 : null,
  performedAt,
  note: null,
})

describe('buildHistory', () => {
  it('puts Measurements and Maintenance in one list, newest day first and newest entry first within a day', () => {
    const history = buildHistory(
      [measurement('2026-03-01T08:00:00Z'), measurement('2026-02-27T20:00:00Z')],
      [care('2026-03-01T10:00:00Z'), care('2026-02-27T09:00:00Z', 'pruning')],
      'UTC',
    )
    expect(history.map((d) => d.day)).toEqual(['2026-03-01', '2026-02-27'])
    expect(history[0].entries.map((e) => e.kind)).toEqual(['maintenance', 'measurements'])
    expect(history[1].entries.map((e) => e.kind)).toEqual(['measurements', 'maintenance'])
  })

  it('keeps the Measurements taken together as one entry', () => {
    const history = buildHistory(
      [measurement('2026-03-01T08:00:00Z', 'ph'), measurement('2026-03-01T08:00:00Z', 'nitrate')],
      [],
      'UTC',
    )
    expect(history).toHaveLength(1)
    expect(history[0].entries).toHaveLength(1)
    const [entry] = history[0].entries
    expect(entry.kind === 'measurements' && entry.group.items).toHaveLength(2)
  })

  it('splits days where the person is, not in UTC', () => {
    const history = buildHistory([], [care('2026-03-01T02:30:00Z')], 'America/Sao_Paulo')
    expect(history.map((d) => d.day)).toEqual(['2026-02-28'])
  })

  it('is empty when there is nothing', () => {
    expect(buildHistory([], [], 'UTC')).toEqual([])
  })
})

describe('markersIn', () => {
  const from = Date.parse('2026-02-01T00:00:00Z')
  const to = Date.parse('2026-03-01T00:00:00Z')

  it('keeps the Maintenance inside the range, oldest first, with its type', () => {
    const markers = markersIn(
      [care('2026-02-20T10:00:00Z', 'pruning'), care('2026-01-15T10:00:00Z'), care('2026-02-05T10:00:00Z')],
      from,
      to,
    )
    expect(markers.map((m) => [m.type, m.at])).toEqual([
      ['water_change', Date.parse('2026-02-05T10:00:00Z')],
      ['pruning', Date.parse('2026-02-20T10:00:00Z')],
    ])
  })

  it('includes both ends of the range', () => {
    expect(markersIn([care('2026-02-01T00:00:00Z'), care('2026-03-01T00:00:00Z')], from, to)).toHaveLength(2)
  })
})

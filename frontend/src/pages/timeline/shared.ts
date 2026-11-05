import { useMemo } from 'react'
import type { Language } from '../../i18n/language'
import type { HistoryDay, Marker } from '../../tanks/history'
import type { Measurement } from '../../tanks/measurements'
import { changeBetween, type Change } from '../../tanks/latest'
import { plateOrder } from '../../tanks/plates'
import type { Panel } from '../../tanks/series'

const rank = (panel: Panel) => {
  const at = (plateOrder as readonly string[]).indexOf(panel.parameter)
  return at === -1 ? plateOrder.length : at
}

/** The panels in the order a keeper reads them: pH, temperature, the nitrogen cycle, then the rest. */
export const byPriority = (panels: readonly Panel[]) => [...panels].sort((a, b) => rank(a) - rank(b))

/** How the newest value moved from the one before it, or null with fewer than two points. */
export function lastChange(panel: Panel): Change | null {
  const { points } = panel
  if (points.length < 2) return null
  return changeBetween(points[points.length - 2].value, points[points.length - 1].value)
}

/** A date axis label, with the year only when the axis is long enough to cross into another one. */
export function useDateLabel(language: Language, from: number, to: number) {
  return useMemo(() => {
    const format = new Intl.DateTimeFormat(language, {
      day: 'numeric',
      month: 'short',
      year: to - from > 300 * 24 * 60 * 60 * 1000 ? 'numeric' : undefined,
    })
    return (instant: number) => format.format(new Date(instant))
  }, [language, from, to])
}

export const changeSymbols = { up: '▲', down: '▼', same: '=' } as const

/** Water changes are drawn as a blue diamond, everything else as an ink square: the shape says which, not only the colour. */
export const isWaterChange = (marker: Marker) => marker.type === 'water_change'

/** A calendar day as "2026-03-01", in the browser's time zone, like the history's days. */
export const dayKey = (date: Date | number) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The instants a "2026-03-01" covers, in the browser's time zone: its first millisecond and the first of the next day. */
export function dayBounds(key: string): [number, number] {
  const [year, month, day] = key.split('-').map(Number)
  return [new Date(year, month - 1, day).getTime(), new Date(year, month - 1, day + 1).getTime()]
}

export type Kind = 'measured' | 'water' | 'care' | 'photo'
type Kinds = Record<Kind, boolean>

export function kindsOf(day: HistoryDay): Kinds {
  return {
    measured: day.entries.some((e) => e.kind === 'measurements'),
    water: day.entries.some((e) => e.kind === 'maintenance' && e.entry.type === 'water_change'),
    care: day.entries.some((e) => e.kind === 'maintenance' && e.entry.type !== 'water_change'),
    photo: day.entries.some((e) => e.kind === 'photo'),
  }
}

/** The change of each value against the same Parameter's previous one, taken from the whole history. */
export function changesById(measurements: readonly Measurement[]): Map<string, Change> {
  const byParameter = new Map<string, Measurement[]>()
  for (const m of [...measurements].reverse()) byParameter.set(m.parameter, [...(byParameter.get(m.parameter) ?? []), m])
  const result = new Map<string, Change>()
  for (const list of byParameter.values()) {
    list.forEach((m, i) => {
      if (i > 0) result.set(m.id, changeBetween(list[i - 1].value, m.value))
    })
  }
  return result
}

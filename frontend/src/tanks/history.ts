import type { Maintenance, MaintenanceType } from './maintenance'
import { groupByMoment, type Measurement, type MomentGroup } from './measurements'
import type { Photo } from './photos'

/**
 * One thing that happened to a tank. Every kind carries its instant in `at`, so the list is built by sorting on
 * it alone: a new kind is one more member of this union and one more list passed to `buildHistory`.
 */
export type HistoryEntry =
  | { kind: 'measurements'; at: number; group: MomentGroup }
  | { kind: 'maintenance'; at: number; entry: Maintenance }
  | { kind: 'photo'; at: number; photo: Photo }

/** The entries of one calendar day (`day` is "2026-03-01"), newest first. */
export type HistoryDay = { day: string; entries: HistoryEntry[] }

/** The calendar day an instant falls on in `timeZone` (the browser's, unless one is given). */
function dayOf(at: number, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(at)
}

/** Measurements, Maintenance and Tank Photos as one history, grouped by day, newest day and newest entry first. */
export function buildHistory(
  measurements: readonly Measurement[],
  maintenance: readonly Maintenance[],
  photos: readonly Photo[],
  timeZone?: string,
): HistoryDay[] {
  const entries: HistoryEntry[] = [
    ...maintenance.map((entry): HistoryEntry => ({ kind: 'maintenance', at: Date.parse(entry.performedAt), entry })),
    ...photos.map((photo): HistoryEntry => ({ kind: 'photo', at: Date.parse(photo.takenAt), photo })),
    ...groupByMoment([...measurements]).map(
      (group): HistoryEntry => ({ kind: 'measurements', at: Date.parse(group.measuredAt), group }),
    ),
  ]
  // Array.sort is stable, so entries at the same instant keep the order above: Maintenance, photos, Measurements.
  entries.sort((a, b) => b.at - a.at)

  const days: HistoryDay[] = []
  for (const entry of entries) {
    const day = dayOf(entry.at, timeZone)
    const last = days[days.length - 1]
    if (last?.day === day) last.entries.push(entry)
    else days.push({ day, entries: [entry] })
  }
  return days
}

/** A Maintenance placed on a chart's time axis. */
export type Marker = { id: string; at: number; type: MaintenanceType }

/** The Maintenance between `from` and `to` (both included) as chart markers, oldest first. */
export function markersIn(maintenance: readonly Maintenance[], from: number, to: number): Marker[] {
  return maintenance
    .map((m) => ({ id: m.id, at: Date.parse(m.performedAt), type: m.type }))
    .filter((m) => m.at >= from && m.at <= to)
    .sort((a, b) => a.at - b.at)
}

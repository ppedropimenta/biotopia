import type { Measurement, Parameter, ParameterCode } from './measurements'

/** The periods the timeline offers. The tank page's two months is not one of them. */
export const periods = ['m1', 'w12', 'm6', 'all'] as const
export type TimelinePeriod = (typeof periods)[number]
export type Period = TimelinePeriod | 'm2'

const msPerDay = 24 * 60 * 60 * 1000

/** Where a period starts, counting back from `now`; the whole history has no start. */
export function periodStart(period: Period, now: Date): Date | null {
  switch (period) {
    case 'm1':
    case 'm2': {
      const start = new Date(now)
      start.setUTCMonth(start.getUTCMonth() - (period === 'm1' ? 1 : 2))
      return start
    }
    case 'w12':
      return new Date(now.getTime() - 84 * msPerDay)
    case 'm6': {
      const start = new Date(now)
      start.setUTCMonth(start.getUTCMonth() - 6)
      return start
    }
    case 'all':
      return null
  }
}

export type Point = { id: string; at: number; value: number }

/** One Parameter's line: its points oldest first and a scale that holds them. */
export type Panel = {
  parameter: ParameterCode
  unit: string
  points: Point[]
  domain: [number, number]
  ticks: number[]
}

/** Rounds away floating point noise such as 0.30000000000000004. */
const clean = (n: number) => Math.round(n * 1e6) / 1e6

/** A step of 1, 2 or 5 times a power of ten, about a quarter of the span. */
function niceStep(span: number): number {
  const raw = span / 4
  const power = 10 ** Math.floor(Math.log10(raw))
  const n = raw / power
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power
}

/** Round ends and ticks for a panel. No Parameter can be negative in the API, so the scale stays at 0 or above. */
export function niceScale(values: readonly number[]): { domain: [number, number]; ticks: number[] } {
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    const room = Math.max(Math.abs(min) * 0.2, 1) / 2
    min -= room
    max += room
  }
  const step = niceStep(max - min)
  const domain: [number, number] = [Math.max(0, clean(Math.floor(min / step) * step)), clean(Math.ceil(max / step) * step)]
  const ticks: number[] = []
  for (let tick = domain[0]; tick <= domain[1] + step / 1e6; tick = clean(tick + step)) ticks.push(tick)
  return { domain, ticks }
}

/**
 * The panels for a chart: one per Parameter that has Measurements from `from` on, in the order of the Parameter
 * list. `from` null keeps everything. The API gives the Measurements newest first; the points go oldest first.
 */
export function buildPanels(measurements: readonly Measurement[], parameters: readonly Parameter[], from: Date | null): Panel[] {
  const start = from?.getTime() ?? -Infinity
  return parameters.flatMap((parameter) => {
    const points = measurements
      .filter((m) => m.parameter === parameter.code)
      .map((m) => ({ id: m.id, at: new Date(m.measuredAt).getTime(), value: m.value }))
      .filter((point) => point.at >= start)
      .sort((a, b) => a.at - b.at)
    if (points.length === 0) return []
    return [{ parameter: parameter.code, unit: parameter.unit, points, ...niceScale(points.map((p) => p.value)) }]
  })
}

/** `count` instants spread evenly from `start` to `end`, for the labels of the time axis. */
export function timeTicks(start: number, end: number, count: number): number[] {
  if (end <= start) return [start]
  return Array.from({ length: count }, (_, i) => start + ((end - start) * i) / (count - 1))
}

/** The newest `count` values of one Parameter from a newest-first list, oldest first: the line of a sparkline. */
export function recentSeries(measurements: readonly Measurement[], parameter: ParameterCode, count: number): number[] {
  return measurements
    .filter((m) => m.parameter === parameter)
    .slice(0, count)
    .map((m) => m.value)
    .reverse()
}

/**
 * The span the time axis covers: from the oldest point to `now`, whatever the period, so a period wider than the
 * data leaves no empty stretch before the line. The panels are already cut to the period. It is never shorter
 * than a day, so a single point still has a place on the axis.
 */
export function timeRange(panels: readonly Panel[], now: Date): [number, number] {
  const end = now.getTime()
  const oldest = Math.min(end, ...panels.flatMap((p) => p.points.map((point) => point.at)))
  return [Math.min(oldest, end - msPerDay), end]
}

/** The distinct moments of the points, oldest first: where the chart's cursor can stop. */
export function momentsOf(panels: readonly Panel[]): number[] {
  return [...new Set(panels.flatMap((p) => p.points.map((point) => point.at)))].sort((a, b) => a - b)
}

/** The panel with the most points, the first of them on a tie: the one Parameter a small chart can show. */
export function busiestPanel(panels: readonly Panel[]): Panel | undefined {
  return panels.reduce<Panel | undefined>((best, p) => (!best || p.points.length > best.points.length ? p : best), undefined)
}

/** The `count` panels with the most points, in the order they came in (a tie keeps the earlier one). */
export function busiestPanels(panels: readonly Panel[], count: number): Panel[] {
  const busiest = new Set([...panels].sort((a, b) => b.points.length - a.points.length).slice(0, count))
  return panels.filter((panel) => busiest.has(panel))
}

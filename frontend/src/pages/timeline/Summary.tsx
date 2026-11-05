import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { daysAgo } from '../../tanks/dates'
import type { HistoryDay } from '../../tanks/history'
import type { Maintenance } from '../../tanks/maintenance'
import type { Measurement } from '../../tanks/measurements'
import { formatNumber } from '../../tanks/numbers'
import type { Photo } from '../../tanks/photos'
import { useLanguage } from '../../tanks/useLanguage'
import { Mark } from './Calendar'
import { kindsOf, type Kind } from './shared'

const msPerDay = 24 * 60 * 60 * 1000

/** The whole days between two history days ("2026-03-01" and "2026-03-09" are 8 apart). */
const daysBetween = (a: string, b: string) => {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / msPerDay)
}

const newest = (instants: readonly string[]) => instants.reduce<string | null>((best, at) => (best === null || Date.parse(at) > Date.parse(best) ? at : best), null)

type Row = { key: string; label: ReactNode; value: ReactNode; muted?: boolean }

/** A titled list of label and value rows, the values on one right edge. */
function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="flex min-w-0 flex-col">
      <h3 className="m-0 border-b-[1.5px] border-ink pb-2 font-mono text-label font-normal tracking-[0.12em] text-ink-muted uppercase">{title}</h3>
      <dl className="m-0">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-4 border-b border-dashed border-ink/30 py-2.5">
            <dt className="flex items-center gap-2 font-mono text-caption text-ink-muted">{row.label}</dt>
            <dd className={row.muted ? 'm-0 shrink-0 text-right text-base whitespace-nowrap text-ink-muted' : 'm-0 shrink-0 text-right text-lead leading-tight whitespace-nowrap first-letter:uppercase'}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const labelWithMark = (kind: Kind, text: string) => (
  <>
    <Mark kind={kind} />
    {text}
  </>
)

/**
 * What a keeper wants to know about the tank, in three short lists: when each thing was last done, what the period
 * holds (the counts also say what each mark of the calendar means) and the rhythm of the care. The rhythm rows appear
 * only with enough days behind them to mean something.
 */
export function Summary({
  days,
  now,
  measurements,
  maintenance,
  photos,
}: {
  days: HistoryDay[]
  now: Date
  measurements: readonly Measurement[]
  maintenance: readonly Maintenance[]
  photos: readonly Photo[]
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const ago = (at: string | null) => (at ? daysAgo(at, now, language) : null)

  const entries = days.flatMap((d) => d.entries)
  const water = entries.flatMap((e) => (e.kind === 'maintenance' && e.entry.type === 'water_change' ? [e.entry] : []))
  const measured = entries.filter((e) => e.kind === 'measurements').length
  const care = entries.filter((e) => e.kind === 'maintenance' && e.entry.type !== 'water_change').length
  const shots = entries.filter((e) => e.kind === 'photo').length

  const lastMeasured = newest(measurements.map((m) => m.measuredAt))
  const lastWater = maintenance.filter((m) => m.type === 'water_change').reduce<Maintenance | null>((best, m) => (best === null || Date.parse(m.performedAt) > Date.parse(best.performedAt) ? m : best), null)
  const lastPhoto = newest(photos.map((p) => p.takenAt))
  const none = <>{t('timeline.none')}</>

  const lastTime: Row[] = [
    { key: 'measured', label: labelWithMark('measured', t('timeline.history.measured')), value: ago(lastMeasured) ?? none, muted: !lastMeasured },
    {
      key: 'water',
      label: labelWithMark('water', t('maintenance.types.water_change')),
      value: lastWater ? (
        <>
          {ago(lastWater.performedAt)}
          {lastWater.percent !== null && <span className="font-mono text-caption text-ink-muted"> · {formatNumber(lastWater.percent, language)}%</span>}
        </>
      ) : (
        none
      ),
      muted: !lastWater,
    },
    { key: 'photo', label: labelWithMark('photo', t('timeline.photo')), value: ago(lastPhoto) ?? none, muted: !lastPhoto },
  ]

  const counts: Row[] = [
    { key: 'measured', label: labelWithMark('measured', t('timeline.points', { count: measured }).replace(/^\d+\s*/, '')), value: formatNumber(measured, language) },
    { key: 'water', label: labelWithMark('water', t('timeline.waterChanges', { count: water.length }).replace(/^\d+\s*/, '')), value: formatNumber(water.length, language) },
    { key: 'care', label: labelWithMark('care', t('timeline.otherCare', { count: care }).replace(/^\d+\s*/, '')), value: formatNumber(care, language) },
    { key: 'photo', label: labelWithMark('photo', t('photos.count', { count: shots }).replace(/^\d+\s*/, '')), value: formatNumber(shots, language) },
  ]

  // Days come newest first, so the gaps are between neighbours in that order.
  const measuredDays = days.filter((d) => kindsOf(d).measured).map((d) => d.day)
  const gaps = measuredDays.slice(1).map((day, i) => daysBetween(day, measuredDays[i]))
  const longestGap = gaps.length >= 2 ? Math.max(...gaps) : 0
  const waterTimes = water.map((m) => Date.parse(m.performedAt)).sort((a, b) => a - b)
  const waterEvery = waterTimes.length >= 3 ? Math.round((waterTimes[waterTimes.length - 1] - waterTimes[0]) / (waterTimes.length - 1) / msPerDay) : 0
  const rhythm: Row[] = [
    ...(waterEvery > 0
      ? [{ key: 'water', label: labelWithMark('water', t('maintenance.types.water_change')), value: t('timeline.everyDays', { count: waterEvery }) }]
      : []),
    ...(longestGap > 1
      ? [{ key: 'gap', label: labelWithMark('measured', t('timeline.longestGap')), value: t('timeline.daysCount', { count: longestGap }) }]
      : []),
  ]

  return (
    <div className="grid gap-x-10 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
      <Group title={t('timeline.lastTime')} rows={lastTime} />
      <Group title={t('timeline.inPeriod')} rows={counts} />
      {rhythm.length > 0 && <Group title={t('timeline.rhythm')} rows={rhythm} />}
    </div>
  )
}

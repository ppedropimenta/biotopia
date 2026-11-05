import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Handwritten } from '../../components/ui/Paper'
import { Plate, PlateCorners } from '../../components/ui/Plate'
import { daysAgo } from '../../tanks/dates'
import { markersIn } from '../../tanks/history'
import type { Maintenance } from '../../tanks/maintenance'
import { formatMoment, valueDecimals, type Measurement, type ParameterCode } from '../../tanks/measurements'
import { formatNumber } from '../../tanks/numbers'
import type { Photo } from '../../tanks/photos'
import { PhotoViewer } from '../../tanks/PhotoViewer'
import { momentsOf, timeRange, type Panel } from '../../tanks/series'
import type { Tank } from '../../tanks/types'
import { useLanguage } from '../../tanks/useLanguage'
import { CareLegend } from './Controls'
import { FocusChart, type CareEntry } from './FocusChart'
import { byPriority, dayBounds, dayKey } from './shared'
import { ParameterTiles } from './Tiles'

/**
 * One Parameter at a time on a large plate, picked from a row of tiles that already show each one's latest value.
 * What was done to the tank (water changes, other care, photos) sits on the same time axis, so a change in the line
 * can be read against what happened just before it. Hovering reads a Measurement date; clicking keeps it.
 */
export function ParameterBoard({
  panels,
  measurements,
  maintenance,
  photos,
  tank,
  now,
}: {
  panels: Panel[]
  measurements: Measurement[]
  maintenance: Maintenance[]
  photos: Photo[]
  tank: Pick<Tank, 'id' | 'name' | 'readOnly'>
  now: Date
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const ordered = byPriority(panels)
  const [code, setCode] = useState<ParameterCode>(ordered[0].parameter)
  // What the pointer is over is read while it is there; what was clicked stays until it is clicked again.
  const [hover, setHover] = useState<number | null>(null)
  const [pin, setPin] = useState<number | null>(null)
  const [viewing, setViewing] = useState<Photo[] | null>(null)
  const number = (value: number) => formatNumber(value, language, { maxDecimals: valueDecimals })

  const panel = ordered.find((p) => p.parameter === code) ?? ordered[0]
  // The axis follows every Parameter, so it does not jump when another tile is picked.
  const [from, to] = timeRange(panels, now)
  const markers = markersIn(maintenance, from, to)
  const care: CareEntry[] = markers.map((m) => ({ ...m, percent: maintenance.find((c) => c.id === m.id)?.percent ?? null }))
  const photosIn = photos.filter((p) => Date.parse(p.takenAt) >= from && Date.parse(p.takenAt) <= to)

  const selectedAt = hover ?? pin ?? panel.points[panel.points.length - 1].at
  const isLatest = hover === null && pin === null
  const atMoment = ordered.flatMap((p) => {
    const point = p.points.find((q) => q.at === selectedAt)
    return point ? [{ panel: p, value: point.value }] : []
  })
  const note = measurements.find((m) => Date.parse(m.measuredAt) === selectedAt && m.note)?.note
  const lastWater = [...care].reverse().find((c) => c.type === 'water_change' && c.at <= selectedAt)
  // Seen from the latest date the last water change is "N days ago"; from an earlier one it is "N days before it".
  const daysBefore = lastWater ? Math.round((dayBounds(dayKey(selectedAt))[0] - dayBounds(dayKey(lastWater.at))[0]) / (24 * 60 * 60 * 1000)) : 0
  const name = t(`parameters.${panel.parameter}`)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ParameterTiles
        panels={ordered}
        selected={panel.parameter}
        onPick={setCode}
        label={t('timeline.pickParameter')}
      />

      <Plate size="md" className="flex min-w-0 flex-col gap-3" aria-label={name}>
        <PlateCorners
          items={[`${name}${panel.unit ? ` · ${panel.unit}` : ''}`, t('timeline.points', { count: panel.points.length })]}
        />
        <div className="flex flex-col gap-1.5 border-b border-dashed border-ink/45 pb-3" aria-live="polite">
          <p className="m-0 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-label tracking-[0.08em] text-ink-muted uppercase">
            <span>
              {isLatest ? t('timeline.latest') : t('timeline.selected')} · {formatMoment(new Date(selectedAt).toISOString(), language)}
            </span>
            {pin !== null && (
              <button
                type="button"
                onClick={() => setPin(null)}
                className="cursor-pointer border-0 bg-transparent p-0 font-mono text-caption tracking-normal text-ink normal-case underline underline-offset-2"
              >
                {t('timeline.backToLatest')}
              </button>
            )}
          </p>
          <p className="m-0 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm">
            {atMoment.map(({ panel: p, value }) => (
              <span key={p.parameter} className={p === panel ? 'font-semibold text-ink' : 'text-ink-soft'}>
                {t(`parameters.${p.parameter}`)} {number(value)}
                {p.unit ? ` ${p.unit}` : ''}
              </span>
            ))}
          </p>
          <p className="m-0 flex min-h-7 flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="font-mono text-caption text-ink-muted">
              {!lastWater
                ? t('timeline.noWaterChange')
                : isLatest
                  ? t('timeline.lastWaterChange', { when: daysAgo(new Date(lastWater.at).toISOString(), now, language) })
                  : daysBefore === 0
                    ? t('timeline.waterChangeSameDay')
                    : t('timeline.waterChangeBefore', { count: daysBefore })}
            </span>
            {note && (
              <Handwritten size="sm" className="[overflow-wrap:anywhere]">
                {note}
              </Handwritten>
            )}
          </p>
        </div>
        <FocusChart
          panel={panel}
          from={from}
          to={to}
          care={care}
          photos={photosIn}
          tank={tank}
          selectedAt={selectedAt}
          onSelect={setHover}
          onPin={(at) => setPin(at === null || at === pin ? null : at)}
          onOpenPhotos={setViewing}
          description={t('timeline.description', { parameters: name, count: momentsOf([panel]).length })}
        />
      </Plate>
      <CareLegend markers={markers} />
      {viewing && <PhotoViewer tank={tank} photos={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

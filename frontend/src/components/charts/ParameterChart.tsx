import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../lib/cx'
import { scaleLinear } from '../../lib/ranges'
import type { Marker } from '../../tanks/history'
import { stampTones } from '../../tanks/maintenance'
import { formatMoment, valueDecimals } from '../../tanks/measurements'
import { formatNumber } from '../../tanks/numbers'
import { momentsOf, timeTicks, type Panel } from '../../tanks/series'
import { useLanguage } from '../../tanks/useLanguage'

/**
 * Parameters over time: one panel per Parameter, all on the same time axis, never two value axes. The line is
 * always ink; there is no target range yet, so no colour carries a status. Hover or ← → with the focus on the
 * chart picks a moment, Esc clears it, and a line of text under the chart says the same in words.
 */

const geometry = {
  full: { width: 1100, left: 70, rightPad: 64, panelHeight: 140, minWidth: 'min-w-[720px]' },
  compact: { width: 560, left: 56, rightPad: 22, panelHeight: 120, minWidth: '' },
} as const

/** The strokes and fills of the marker tones, written out whole so Tailwind finds them. */
const markerTone = {
  neon: { line: 'stroke-neon', glyph: 'fill-neon', text: 'fill-neon' },
  cardinal: { line: 'stroke-cardinal', glyph: 'fill-cardinal', text: 'fill-cardinal' },
  forest: { line: 'stroke-forest', glyph: 'fill-forest', text: 'fill-forest' },
  ochre: { line: 'stroke-ochre', glyph: 'fill-ochre', text: 'fill-ochre' },
  ink: { line: 'stroke-ink', glyph: 'fill-ink', text: 'fill-ink' },
  muted: { line: 'stroke-ink-muted', glyph: 'fill-ink-muted', text: 'fill-ink-muted' },
  amber: { line: 'stroke-amber', glyph: 'fill-amber', text: 'fill-amber' },
} as const

/** The room a lane of marker labels takes between the last panel and the time axis. */
const laneHeight = 30
/** Labels closer than this would overlap, so the later one is left to the list for screen readers. */
const labelGap = 54

const top = 40
const panelGap = 40
const day = 24 * 60 * 60 * 1000

export function ParameterChart({
  panels,
  from,
  to,
  markers = [],
  description,
  size = 'full',
  className,
}: {
  panels: readonly Panel[]
  from: number
  to: number
  /** Maintenance in the time range: a line through every panel and a label in a lane above the time axis. */
  markers?: readonly Marker[]
  /** What the chart shows, for a screen reader: the drawing alone says nothing. */
  description: string
  size?: 'full' | 'compact'
  className?: string
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const { width, left, rightPad, panelHeight, minWidth } = geometry[size]
  const right = width - rightPad
  const [selected, setSelected] = useState<number | null>(null)

  const x = useMemo(() => scaleLinear([from, to], [left, right]), [from, to, left, right])
  const moments = useMemo(() => momentsOf(panels), [panels])
  const number = (value: number) => formatNumber(value, language, { maxDecimals: valueDecimals })

  const panelTop = (i: number) => top + i * (panelHeight + panelGap)
  // The ids of the markers that get a label: each one at least `labelGap` after the last one that did.
  const labelled = useMemo(() => {
    const ids = new Set<string>()
    let lastX = -Infinity
    for (const marker of markers) {
      if (x(marker.at) - lastX >= labelGap) {
        ids.add(marker.id)
        lastX = x(marker.at)
      }
    }
    return ids
  }, [markers, x])
  const lane = markers.length > 0 ? laneHeight : 0
  const axisY = panelTop(panels.length - 1) + panelHeight + 36 + lane
  const height = axisY + 34

  // The year is added only when the axis is long enough to cross into another one.
  const dateLabel = useMemo(() => {
    const format = new Intl.DateTimeFormat(language, {
      day: 'numeric',
      month: 'short',
      year: to - from > 300 * day ? 'numeric' : undefined,
    })
    return (instant: number) => format.format(new Date(instant))
  }, [language, from, to])

  const select = (i: number | null) =>
    setSelected(i === null ? null : Math.max(0, Math.min(moments.length - 1, i)))

  const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement
    if (!svg || moments.length === 0) return
    const box = svg.getBoundingClientRect()
    const at = ((e.clientX - box.left) / box.width) * width
    let nearest = 0
    moments.forEach((moment, i) => {
      if (Math.abs(x(moment) - at) < Math.abs(x(moments[nearest]) - at)) nearest = i
    })
    select(nearest)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') select(selected === null ? 0 : selected + 1)
    else if (e.key === 'ArrowLeft') select(selected === null ? moments.length - 1 : selected - 1)
    else if (e.key === 'Escape') select(null)
    else return
    e.preventDefault()
  }

  const selectedAt = selected === null ? null : moments[selected]
  const readout =
    selectedAt === null
      ? ''
      : [
          formatMoment(new Date(selectedAt).toISOString(), language),
          ...panels.flatMap((panel) => {
            const point = panel.points.find((p) => p.at === selectedAt)
            if (!point) return []
            return [`${t(`parameters.${panel.parameter}`)} ${number(point.value)}${panel.unit ? ` ${panel.unit}` : ''}`]
          }),
        ].join(' · ')

  return (
    <div className={cx('relative', className)}>
      {/* A focusable group, since the keys act on the whole chart. */}
      <div
        role="group"
        aria-label={description}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-neon"
      >
        <div className={minWidth}>
          <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden="true">
            {panels.map((panel, i) => {
              const y = scaleLinear(panel.domain, [panelTop(i) + panelHeight, panelTop(i)])
              const line = panel.points
                .map((p, j) => `${j ? 'L' : 'M'}${x(p.at).toFixed(1)} ${y(p.value).toFixed(1)}`)
                .join(' ')
              const last = panel.points[panel.points.length - 1]
              return (
                <g key={panel.parameter}>
                  <text x={left} y={panelTop(i) - 12} className="fill-ink font-mono" fontSize="12" letterSpacing="1.2">
                    <tspan className={panel.parameter === 'ph' ? undefined : 'uppercase'}>
                      {t(`parameters.${panel.parameter}`)}
                    </tspan>
                    {panel.unit && <tspan> · {panel.unit}</tspan>}
                  </text>
                  {panel.ticks.map((tick) => (
                    <g key={tick}>
                      <line x1={left} y1={y(tick)} x2={right} y2={y(tick)} className="stroke-ink" strokeOpacity={0.12} />
                      <text x={left - 10} y={y(tick) + 4} textAnchor="end" fontSize="10.5" className="fill-ink-muted font-mono">
                        {number(tick)}
                      </text>
                    </g>
                  ))}
                  <path d={line} fill="none" className="stroke-ink" strokeWidth={2} strokeLinejoin="round" />
                  {panel.points.map((p) => {
                    const isSelected = p.at === selectedAt
                    return (
                      <circle
                        key={p.id}
                        cx={x(p.at)}
                        cy={y(p.value)}
                        r={isSelected ? 7 : 4.5}
                        className={isSelected ? 'fill-ink stroke-paper-card' : 'fill-paper-card stroke-ink'}
                        strokeWidth={2}
                      />
                    )
                  })}
                  <text x={x(last.at)} y={y(last.value) + 20} textAnchor="middle" fontSize="11.5" className="fill-ink font-mono">
                    {number(last.value)}
                  </text>
                </g>
              )
            })}

            {markers.map((marker) => {
              const tone = markerTone[stampTones[marker.type]]
              const mx = x(marker.at)
              return (
                <g key={marker.id}>
                  <line
                    x1={mx}
                    y1={top - 6}
                    x2={mx}
                    y2={axisY}
                    className={tone.line}
                    strokeWidth={1.2}
                    strokeDasharray="2 4"
                    strokeOpacity={0.7}
                  />
                  <path d={`M${mx} ${axisY - 22} l5 5 l-5 5 l-5 -5 z`} className={tone.glyph} />
                  {labelled.has(marker.id) && (
                    <text x={mx} y={axisY - 28} textAnchor="middle" fontSize="10" letterSpacing="0.8" className={`${tone.text} font-mono uppercase`}>
                      {t(`maintenance.stamps.${marker.type}`)}
                    </text>
                  )}
                </g>
              )
            })}

            <line x1={left} y1={axisY} x2={right} y2={axisY} className="stroke-ink" strokeWidth={1.2} />
            {timeTicks(from, to, size === 'full' ? 6 : 4).map((instant) => (
              <g key={instant}>
                <line x1={x(instant)} y1={axisY - 4} x2={x(instant)} y2={axisY + 4} className="stroke-ink" />
                <text x={x(instant)} y={axisY + 22} textAnchor="middle" fontSize="10.5" className="fill-ink-muted font-mono">
                  {dateLabel(instant)}
                </text>
              </g>
            ))}

            {selectedAt !== null && (
              <line x1={x(selectedAt)} y1={top - 6} x2={x(selectedAt)} y2={axisY + 4} className="stroke-ink" strokeWidth={1.2} strokeDasharray="4 4" />
            )}
            <rect
              x={left - 20}
              y={0}
              width={right - left + 40}
              height={axisY}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerLeave={() => select(null)}
            />
          </svg>
        </div>
      </div>
      <p className="m-0 mt-2 min-h-6 font-mono text-label text-ink" aria-live="polite">
        {readout}
      </p>
      <p className="sr-only">{t('timeline.keyboardHint')}</p>
      {markers.length > 0 && (
        <ul className="sr-only">
          {markers.map((marker) => (
            <li key={marker.id}>
              {t('timeline.marker', {
                type: t(`maintenance.types.${marker.type}`),
                when: formatMoment(new Date(marker.at).toISOString(), language),
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

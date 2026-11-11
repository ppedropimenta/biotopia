import { useLayoutEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../lib/cx'
import { useElementWidth } from '../../lib/useElementWidth'
import { scaleLinear } from '../../lib/ranges'
import type { Marker } from '../../tanks/history'
import { valueDecimals } from '../../tanks/measurements'
import { formatNumber } from '../../tanks/numbers'
import { photoUrl, type Photo } from '../../tanks/photos'
import type { Tank } from '../../tanks/types'
import { timeTicks, type Panel } from '../../tanks/series'
import { useLanguage } from '../../tanks/useLanguage'
import { isWaterChange, useDateLabel } from './shared'

const left = 56
const minWidth = 640
const right = 18
const top = 18
export type CareEntry = Marker & { percent: number | null }

/**
 * One Parameter on a large plate, with what was done to the tank on the same time axis: water changes as stamps,
 * other care as labels, photos as small prints under the dates. Hover or the arrow keys pick a Measurement date.
 * Drawn in real pixels, so the type stays the same size on a phone.
 */
export function FocusChart({
  panel,
  from,
  to,
  care,
  photos,
  tank,
  selectedAt,
  onSelect,
  onPin,
  onOpenPhotos,
  description,
}: {
  panel: Panel
  from: number
  to: number
  care: readonly CareEntry[]
  photos: readonly Photo[]
  tank: Pick<Tank, 'id' | 'name'>
  selectedAt: number
  onSelect: (at: number | null) => void
  /** A click or a tap keeps the Measurement date under the pointer selected; Escape lets go (null). */
  onPin: (at: number | null) => void
  /** A print under the axis was opened: the photos of its day. */
  onOpenPhotos: (photos: Photo[]) => void
  description: string
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [available, ref] = useElementWidth()
  // The chart is never drawn narrower than this: on a phone it scrolls sideways, opened on the latest dates.
  const width = available > 0 ? Math.max(available, minWidth) : 0
  const scroller = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollLeft = el.scrollWidth
  }, [width])
  const dateLabel = useDateLabel(language, from, to)
  const number = (value: number) => formatNumber(value, language, { maxDecimals: valueDecimals })

  const narrow = available < 600
  const plotHeight = narrow ? 190 : 250
  const plotBottom = top + plotHeight
  const x = useMemo(() => scaleLinear([from, to], [left, Math.max(left + 1, width - right)]), [from, to, width])
  const y = useMemo(() => scaleLinear(panel.domain, [plotBottom, top]), [panel.domain, plotBottom])
  const line = panel.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const dots = panel.points.length <= 45
  const waterChanges = care.filter(isWaterChange)
  const others = care.filter((c) => !isWaterChange(c))
  // Where a stamp or a label of `half` its width is centred: on its moment, but pushed inside the plot near an edge,
  // so it never covers the lane names on the left. Its dashed line still marks the exact moment.
  const placeAt = (at: number, half: number) =>
    Math.min(Math.max(x(at), left + half), Math.max(left + half, width - right - half))
  const stampRadius = 15

  // Labels of other care sit on the first row where they clear the one before. When no row is free (three rows
  // deep), the care is a plain square on a row of its own under them, so nothing is ever drawn over a label.
  const labelRows = 3
  const rowEnds: number[] = []
  const placed = others.map((marker) => {
    const text = t(`maintenance.stamps.${marker.type}`)
    const w = text.length * 6.4 + 16
    const start = placeAt(marker.at, w / 2) - w / 2
    const row = rowEnds.findIndex((end) => start >= end + 4)
    const at = row !== -1 ? row : rowEnds.length < labelRows ? rowEnds.length : -1
    if (at !== -1) rowEnds[at] = start + w
    return { marker, text, w, row: at, cx: start + w / 2 }
  })
  const squares = placed.some((p) => p.row === -1)
  const careRows = rowEnds.length + (squares ? 1 : 0)
  const rowPitch = 26

  const waterY = plotBottom + 36
  const otherY = waterY + 38
  const axisY = otherY + 28 + Math.max(0, careRows - 1) * rowPitch
  const photoRows = photos.length > 0
  const height = axisY + 30 + (photoRows ? 66 : 0)

  // Photos of one day share one print, with a count.
  const prints = useMemo(() => {
    const byDay = new Map<string, Photo[]>()
    for (const photo of photos) {
      const key = new Date(photo.takenAt).toDateString()
      byDay.set(key, [...(byDay.get(key) ?? []), photo])
    }
    return [...byDay.values()].map((group) => ({ group, at: Date.parse(group[0].takenAt) }))
  }, [photos])

  const moments = panel.points.map((p) => p.at)
  const select = (i: number) => onSelect(moments[Math.max(0, Math.min(moments.length - 1, i))])
  const selectedIndex = moments.indexOf(selectedAt)
  const nearestTo = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect()
    if (!box) return -1
    const at = e.clientX - box.left
    let nearest = 0
    moments.forEach((moment, i) => {
      if (Math.abs(x(moment) - at) < Math.abs(x(moments[nearest]) - at)) nearest = i
    })
    return nearest
  }
  const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
    const nearest = nearestTo(e)
    if (nearest !== -1) select(nearest)
  }
  const onClick = (e: PointerEvent<SVGRectElement>) => {
    const nearest = nearestTo(e)
    if (nearest !== -1) onPin(moments[nearest])
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // With no pointer, the arrow keys keep their choice, so the pinned date follows them.
    const step = (i: number) => onPin(moments[Math.max(0, Math.min(moments.length - 1, i))])
    if (e.key === 'ArrowRight') step(selectedIndex + 1)
    else if (e.key === 'ArrowLeft') step(selectedIndex === -1 ? moments.length - 1 : selectedIndex - 1)
    else if (e.key === 'Escape') {
      onSelect(null)
      onPin(null)
    } else return
    e.preventDefault()
  }

  // A stamp keeps its percentage only when its neighbour is far enough away.
  const stampAt = (i: number) => placeAt(waterChanges[i].at, stampRadius)
  const stampText = (i: number) => (i === 0 || stampAt(i) - stampAt(i - 1) >= 32) && width > 0
  return (
    <div ref={ref} className="relative w-full" style={{ minHeight: height }}>
      <div ref={scroller} className="overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
        <div className="relative" style={{ width: width || undefined, height }}>
          {width > 0 && (
            // The scale and the lane names, at the left edge of the chart.
            <div className="pointer-events-none absolute top-0 left-0" style={{ width: left - 4, height }} aria-hidden="true">
              {[
                ...panel.ticks.map((tick) => ({ key: `t${tick}`, top: y(tick), text: number(tick), caps: false })),
                { key: 'water', top: waterY, text: t('maintenance.stamps.water_change'), caps: true },
                ...(others.length > 0 ? [{ key: 'others', top: otherY, text: t('timeline.others'), caps: true }] : []),
                ...(photoRows ? [{ key: 'photos', top: axisY + 52, text: t('photos.title'), caps: true }] : []),
              ].map((label) => (
                <span
                  key={label.key}
                  className={cx(
                    'absolute right-1.5 -translate-y-1/2 pl-1 font-mono text-[11px] whitespace-nowrap text-ink-muted',
                    label.caps && 'uppercase',
                  )}
                  style={{ top: label.top }}
                >
                  {label.text}
                </span>
              ))}
            </div>
          )}
          <div
            role="group"
            aria-label={description}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="focus-visible:outline-2 focus-visible:outline-neon"
          >
            {width > 0 && (
              <svg width={width} height={height} className="block" aria-hidden="true">
                {panel.ticks.map((tick) => (
                  <g key={tick}>
                    <line x1={left} y1={y(tick)} x2={width - right} y2={y(tick)} className="stroke-ink" strokeOpacity={0.12} />
                  </g>
                ))}
                {waterChanges.map((entry) => (
                  <line
                    key={entry.id}
                    x1={x(entry.at)}
                    y1={top}
                    x2={x(entry.at)}
                    y2={waterY - 14}
                    className="stroke-neon"
                    strokeOpacity={0.3}
                    strokeDasharray="2 4"
                  />
                ))}
                {selectedIndex !== -1 && (
                  <line
                    x1={x(selectedAt)}
                    y1={top - 4}
                    x2={x(selectedAt)}
                    y2={axisY}
                    className="stroke-ink"
                    strokeWidth={1.2}
                    strokeDasharray="4 4"
                  />
                )}
                <path d={line} fill="none" className="stroke-ink" strokeWidth={2} strokeLinejoin="round" />
                {panel.points.map((p) => {
                  const selected = p.at === selectedAt
                  if (!dots && !selected) return null
                  return (
                    <circle
                      key={p.id}
                      cx={x(p.at)}
                      cy={y(p.value)}
                      r={selected ? 7 : 4}
                      strokeWidth={2}
                      className={selected ? 'fill-ink stroke-paper-card' : 'fill-paper-card stroke-ink'}
                    />
                  )
                })}

                {waterChanges.map((entry, i) =>
                  stampText(i) ? (
                    <g key={entry.id} transform={`translate(${stampAt(i)} ${waterY})`}>
                      <circle r={stampRadius} fill="none" strokeWidth={2} className="stroke-neon" />
                      <circle r={11.5} fill="none" strokeWidth={0.8} className="stroke-neon" />
                      <text textAnchor="middle" y={3.5} fontSize="10" className="fill-neon font-mono">
                        {entry.percent === null ? '' : `${formatNumber(entry.percent, language)}%`}
                      </text>
                    </g>
                  ) : (
                    <circle key={entry.id} cx={stampAt(i)} cy={waterY} r={4.5} className="fill-neon" />
                  ),
                )}

                {placed.map(({ marker, text, w, row, cx }) => {
                  const rowY = otherY + (row === -1 ? rowEnds.length : row) * rowPitch
                  return row !== -1 ? (
                    <g key={marker.id} transform={`translate(${cx} ${rowY})`}>
                      <rect x={-w / 2} y={-10} width={w} height={20} rx={10} fill="none" className="stroke-ink-muted" />
                      <text
                        textAnchor="middle"
                        y={3.5}
                        fontSize="10"
                        letterSpacing="0.8"
                        className="fill-ink font-mono uppercase"
                      >
                        {text}
                      </text>
                    </g>
                  ) : (
                    <rect key={marker.id} x={x(marker.at) - 3.5} y={rowY - 3.5} width={7} height={7} className="fill-ink-muted" />
                  )
                })}

                <line x1={left} y1={axisY} x2={width - right} y2={axisY} className="stroke-ink" strokeWidth={1.2} />
                {timeTicks(from, to, narrow ? 5 : 7).map((instant, i, all) => (
                  <g key={instant}>
                    <line x1={x(instant)} y1={axisY - 4} x2={x(instant)} y2={axisY + 4} className="stroke-ink" />
                    <text
                      x={x(instant)}
                      y={axisY + 22}
                      textAnchor={i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle'}
                      fontSize="10.5"
                      className="fill-ink-muted font-mono"
                    >
                      {dateLabel(instant)}
                    </text>
                  </g>
                ))}

                <rect
                  x={left - 14}
                  y={0}
                  width={Math.max(0, width - right - left + 28)}
                  height={plotBottom}
                  fill="transparent"
                  onPointerMove={onPointerMove}
                  onPointerLeave={() => onSelect(null)}
                  onClick={onClick}
                  className="cursor-pointer"
                />
              </svg>
            )}
          </div>
          {width > 0 &&
            prints.map(({ group, at }, i) => {
              const px = Math.min(width - right - 26, Math.max(left + 26, x(at)))
              return (
                <button
                  key={group[0].id}
                  type="button"
                  onClick={() => onOpenPhotos(group)}
                  aria-label={t('photos.view', { date: new Date(group[0].takenAt).toLocaleDateString(language) })}
                  className="absolute cursor-pointer border-0 bg-transparent p-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-neon"
                  style={{
                    left: px - 24,
                    top: axisY + 33,
                    width: 48,
                    height: 52,
                    transform: `rotate(${[-3, 2, -1.5][i % 3]}deg)`,
                  }}
                >
                  <span className="relative block size-full border border-ink/40 bg-paper-photo">
                    <img
                      src={photoUrl(tank.id, group[0].id)}
                      alt=""
                      loading="lazy"
                      className="absolute top-[3px] left-[3px] h-9 w-[42px] object-cover"
                    />
                    {group.length > 1 && (
                      <span className="absolute inset-x-0 bottom-0.5 text-center font-mono text-[10px] leading-none">
                        ×{group.length}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
        </div>
      </div>
      <p className="sr-only">{t('timeline.keyboardHint')}</p>
      {care.length > 0 && (
        <ul className="sr-only">
          {care.map((entry) => (
            <li key={entry.id}>
              {t('timeline.marker', {
                type: t(`maintenance.types.${entry.type}`),
                when: new Date(entry.at).toLocaleDateString(language),
              })}
              {entry.percent !== null ? `, ${entry.percent}%` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../lib/cx'
import { useElementWidth } from '../../lib/useElementWidth'
import type { HistoryDay } from '../../tanks/history'
import { useLanguage } from '../../tanks/useLanguage'
import { dayKey, kindsOf, type Kind } from './shared'

const msPerDay = 24 * 60 * 60 * 1000
/** A day is never narrower than this, in pixels; a period with more weeks than fit scrolls sideways instead. */
const minCell = 22
/** Below this width a day gets smaller marks, so up to four still fit in it. */
const smallBelow = 28
const gap = 4

/** Each kind of record has its own shape, so the calendar reads without colour: dot, diamond, square, ring. */
export function Mark({ kind, small = false }: { kind: Kind; small?: boolean }) {
  return (
    <span aria-hidden="true" className={cx('flex items-center justify-center', small ? 'size-2' : 'size-2.5')}>
      {kind === 'measured' && <span className={cx('rounded-full bg-ink', small ? 'size-1.5' : 'size-2')} />}
      {kind === 'water' && <span className={cx('rotate-45 bg-neon', small ? 'size-1 scale-125' : 'size-1.5 scale-125')} />}
      {kind === 'care' && <span className={cx('bg-ink-muted', small ? 'size-1' : 'size-1.5')} />}
      {kind === 'photo' && <span className={cx('rounded-full border-ink', small ? 'size-1.5 border' : 'size-2 border-[1.5px]')} />}
    </span>
  )
}

function useKindLabel() {
  const { t } = useTranslation()
  return (kind: Kind) =>
    kind === 'measured'
      ? t('timeline.measured')
      : kind === 'water'
        ? t('maintenance.stamps.water_change')
        : kind === 'care'
          ? t('timeline.care')
          : t('timeline.photo')
}

/**
 * The days of the period with something recorded, a week to a column. The calendar always covers the whole period: a
 * day is `cell` pixels wide and shrinks, to a floor, as the weeks pile up; past that floor it scrolls sideways, opened
 * on the latest weeks. A day with a record is a button, and `selected` is the one being read.
 */
export function Calendar({
  days,
  from,
  now,
  cell,
  selected = null,
  onPick,
}: {
  days: HistoryDay[]
  from: Date | null
  now: Date
  cell: number
  selected?: string | null
  onPick: (day: string) => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const kindLabel = useKindLabel()

  const byDay = new Map(days.map((d) => [d.day, d]))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const oldest = days[days.length - 1].day.split('-').map(Number)
  const first = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : new Date(oldest[0], oldest[1] - 1, oldest[2])
  // The grid starts on the Monday on or before the first day, so every week is whole.
  const gridStart = new Date(first.getFullYear(), first.getMonth(), first.getDate() - ((first.getDay() + 6) % 7))
  const weeks = Math.ceil((today.getTime() - gridStart.getTime()) / msPerDay / 7 + 1 / 7)
  const cellDate = (w: number, d: number) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + w * 7 + d)

  const scroller = useRef<HTMLDivElement>(null)
  const [gridWidth, gridRef] = useElementWidth()
  // The width a day really gets, to choose its marks; the grid is as wide as its weeks need, within the room.
  const dayWidth = gridWidth > 0 ? Math.min(cell, (gridWidth - gap * (weeks - 1)) / weeks) : cell
  const small = dayWidth < smallBelow
  // Opens on the latest weeks; while older ones are out of sight to the left, that edge fades.
  const [olderHidden, setOlderHidden] = useState(false)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollLeft = el.scrollWidth
    setOlderHidden(el.scrollLeft > 1)
  }, [weeks, gridWidth])

  const weekday = new Intl.DateTimeFormat(language, { weekday: 'short' })
  const monthShort = new Intl.DateTimeFormat(language, { month: 'short' })
  const dayLong = new Intl.DateTimeFormat(language, { dateStyle: 'long' })
  const weekdayName = (d: number) => weekday.format(new Date(2021, 0, 4 + d)).replace('.', '').slice(0, 3)

  return (
    <section aria-label={t('timeline.calendar')} className="flex w-fit max-w-full min-w-0 flex-col gap-2.5">
      <div className="flex gap-2">
        <div className="flex w-7 shrink-0 flex-col gap-1 font-mono text-caption text-ink-muted" aria-hidden="true">
          <span className="h-4" />
          <div className="grid gap-1" style={{ gridTemplateRows: `repeat(7, ${Math.max(20, dayWidth)}px)` }}>
            {Array.from({ length: 7 }, (_, d) => (
              <span key={d} className="flex items-center">
                {d % 2 === 0 ? weekdayName(d) : ''}
              </span>
            ))}
          </div>
        </div>
        <div
          ref={scroller}
          onScroll={(e) => setOlderHidden(e.currentTarget.scrollLeft > 1)}
          className="min-w-0 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:thin]"
          style={olderHidden ? { maskImage: 'linear-gradient(to right, transparent, black 32px)' } : undefined}
        >
          <div ref={gridRef} className="flex w-fit flex-col gap-1" style={{ minWidth: weeks * minCell + (weeks - 1) * gap }}>
            <div className="relative h-4 font-mono text-caption text-ink-muted" aria-hidden="true">
              {Array.from({ length: weeks }, (_, w) => {
                const date = cellDate(w, 0)
                const newMonth = w === 0 || cellDate(w - 1, 0).getMonth() !== date.getMonth()
                return newMonth ? (
                  <span key={w} className="absolute whitespace-nowrap" style={{ left: `${(w / weeks) * 100}%` }}>
                    {monthShort.format(date).replace('.', '')}
                  </span>
                ) : null
              })}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(${minCell}px, ${cell}px))` }}>
              {Array.from({ length: weeks * 7 }, (_, i) => {
                const date = cellDate(Math.floor(i / 7), i % 7)
                const key = dayKey(date)
                const day = byDay.get(key)
                const kinds = day && kindsOf(day)
                const empty = date.getTime() > today.getTime() || date.getTime() < first.getTime()
                const isToday = date.getTime() === today.getTime()
                const marks = kinds ? (['measured', 'water', 'care', 'photo'] as const).filter((k) => kinds[k]) : []
                const frame = cx(
                  'flex aspect-square min-h-5 items-center justify-center gap-px border',
                  empty ? 'border-transparent' : isToday ? 'border-[1.5px] border-ink' : 'border-ink/25',
                  marks.length > 0 && 'texture-card border-ink/60',
                )
                if (marks.length === 0) return <span key={i} className={frame} aria-hidden={empty || undefined} />
                const isSelected = selected === key
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onPick(key)}
                    aria-pressed={isSelected}
                    aria-label={`${dayLong.format(date)}: ${marks.map(kindLabel).join(', ')}`}
                    className={cx(
                      frame,
                      'cursor-pointer flex-wrap content-center overflow-hidden p-px hover:bg-paper-photo',
                      isSelected && 'z-10 bg-paper-photo outline-2 outline-offset-1 outline-ink',
                    )}
                  >
                    {marks.map((kind) => (
                      <Mark key={kind} kind={kind} small={small} />
                    ))}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

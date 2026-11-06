import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Handwritten } from '../../components/ui/Paper'
import { Stamp } from '../../components/ui/Stamp'
import { cx } from '../../lib/cx'
import type { HistoryDay } from '../../tanks/history'
import type { Change } from '../../tanks/latest'
import { litersOf, stampTones } from '../../tanks/maintenance'
import { formatMoment, valueDecimals, type Parameter } from '../../tanks/measurements'
import { formatNumber } from '../../tanks/numbers'
import { PhotoCard } from '../../tanks/PhotoCard'
import type { Photo } from '../../tanks/photos'
import { plateOrder } from '../../tanks/plates'
import type { Tank } from '../../tanks/types'
import { useLanguage } from '../../tanks/useLanguage'
import { Delta } from './Controls'

const turns = [-10, 6, -4, 8, -7]

/**
 * One day of the journal: the day number on the left and, on a vertical spine, what happened in it. Measurements are
 * a grid of cells with the change since the previous time, water changes and other care are stamps, photos are prints.
 */
export function DayEntry({
  day,
  parameters,
  changes,
  tank,
  onOpenPhoto,
}: {
  day: HistoryDay
  parameters: readonly Parameter[]
  changes: ReadonlyMap<string, Change>
  tank: Pick<Tank, 'id' | 'name' | 'netVolumeLiters' | 'readOnly'>
  /** A photo was clicked: the caller shows it larger. */
  onOpenPhoto: (photo: Photo) => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [year, month, dayOfMonth] = day.day.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth))
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(date)
  const time = new Intl.DateTimeFormat(language, { timeStyle: 'short' })
  const number = (value: number) => formatNumber(value, language, { maxDecimals: valueDecimals })
  const unit = (code: string) => parameters.find((p) => p.code === code)?.unit ?? ''
  const rank = (code: string) => {
    const at = (plateOrder as readonly string[]).indexOf(code)
    return at === -1 ? plateOrder.length : at
  }

  return (
    <section
      id={`d-${day.day}`}
      className="grid scroll-mt-6 grid-cols-[56px_1fr] gap-x-3 min-[640px]:grid-cols-[84px_1fr] min-[640px]:gap-x-5"
    >
      <h3 className="m-0 flex flex-col items-end pt-2 font-normal">
        <span className="text-h2 leading-none">{dayOfMonth}</span>
        <span className="font-mono text-caption text-ink-muted">{weekday}</span>
      </h3>
      <ol className="relative m-0 flex list-none flex-col gap-5 border-l border-ink/45 p-0 pb-8 pl-5 min-[640px]:pl-7">
        {day.entries.map((entry, i) => {
          const node = (
            <span
              aria-hidden="true"
              className={cx(
                'absolute top-[15px] -left-[25.5px] size-2.5 min-[640px]:-left-[33.5px]',
                entry.kind === 'measurements' && 'rounded-full bg-ink',
                entry.kind === 'maintenance' &&
                  (entry.entry.type === 'water_change' ? 'rotate-45 scale-110 bg-neon' : 'scale-90 bg-ink-muted'),
                entry.kind === 'photo' && 'rounded-full border-[1.5px] border-ink bg-paper',
              )}
            />
          )
          const row = (children: ReactNode, key: string) => (
            <li key={key} className="relative flex flex-col gap-2 pt-2">
              {node}
              {children}
            </li>
          )

          if (entry.kind === 'maintenance') {
            const m = entry.entry
            const isWater = m.type === 'water_change' && m.percent !== null
            const percent = isWater ? number(m.percent!) : ''
            const liters = isWater && tank.netVolumeLiters !== null ? litersOf(m.percent!, tank.netVolumeLiters) : null
            return row(
              <div className="grid grid-cols-[64px_1fr] items-center gap-4">
                <span aria-hidden="true" className="flex justify-center">
                  <Stamp
                    tone={stampTones[m.type]}
                    size="md"
                    rotate={turns[i % turns.length]}
                    top={isWater ? t('maintenance.stamps.water_change') : undefined}
                    main={isWater ? `${percent}%` : t(`maintenance.stamps.${m.type}`)}
                    bottom={liters !== null ? t('maintenance.liters', { value: formatNumber(liters, language) }) : undefined}
                  />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-mono text-caption text-ink-muted">{time.format(entry.at)}</span>
                  <span className="text-lead">
                    {t(`maintenance.types.${m.type}`)}
                    {isWater && ` · ${t('maintenance.percentOfWater', { percent })}`}
                  </span>
                  {m.note && (
                    <Handwritten as="p" size="sm" className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
                      {m.note}
                    </Handwritten>
                  )}
                  {!tank.readOnly && (
                    <Link
                      to={`/tanks/${tank.id}/maintenance/${m.id}/edit`}
                      aria-label={t('maintenance.list.editLabel', {
                        type: t(`maintenance.types.${m.type}`),
                        moment: formatMoment(m.performedAt, language),
                      })}
                      className="inline-flex min-h-11 items-center self-start font-mono text-label"
                    >
                      {t('maintenance.list.edit')}
                    </Link>
                  )}
                </div>
              </div>,
              `c${m.id}`,
            )
          }

          if (entry.kind === 'photo') {
            return row(
              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <PhotoCard tank={tank} photo={entry.photo} index={i} onOpen={() => onOpenPhoto(entry.photo)} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-mono text-caption text-ink-muted">{time.format(entry.at)}</span>
                  <span className="text-lead">{t('timeline.photo')}</span>
                </div>
              </div>,
              `p${entry.photo.id}`,
            )
          }

          const items = [...entry.group.items].sort((a, b) => rank(a.parameter) - rank(b.parameter))
          return row(
            <>
              <span className="font-mono text-caption text-ink-muted">
                {t('timeline.history.measured')} · {time.format(entry.at)}
              </span>
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2 p-0">
                {items.map((m) => {
                  const change = changes.get(m.id)
                  return (
                    <li key={m.id} className="flex flex-col justify-between gap-3 border border-ink/45 texture-card px-2.5 py-2.5">
                      <span className="font-mono text-caption leading-snug text-ink-muted">{t(`parameters.${m.parameter}`)}</span>
                      <span className="flex flex-col gap-1">
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-lead leading-none tabular-nums">{number(m.value)}</span>
                          {unit(m.parameter) && <span className="font-mono text-caption text-ink-muted">{unit(m.parameter)}</span>}
                        </span>
                        <span className="block min-h-[1lh] font-mono text-caption text-ink">{change && <Delta change={change} />}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
              {entry.group.note && (
                <Handwritten as="p" size="sm" className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
                  {entry.group.note}
                </Handwritten>
              )}
            </>,
            `m${entry.group.items[0].id}`,
          )
        })}
      </ol>
    </section>
  )
}

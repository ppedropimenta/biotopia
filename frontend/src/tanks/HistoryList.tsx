import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../components/ui/Structure'
import { formatDay } from './dates'
import type { HistoryDay } from './history'
import { MaintenanceEntry } from './MaintenanceEntry'
import { formatMoment, valueDecimals, type Parameter } from './measurements'
import { formatNumber } from './numbers'
import { PhotoCard } from './PhotoCard'
import type { Tank } from './types'
import { useLanguage } from './useLanguage'

/**
 * A tank's history: the days, newest first, and under each day what happened, newest first. A new kind of entry
 * is one more branch of the `kind` checks below.
 */
export function HistoryList({
  days,
  parameters,
  tank,
}: {
  days: readonly HistoryDay[]
  parameters: readonly Parameter[]
  tank: Pick<Tank, 'id' | 'name' | 'netVolumeLiters'>
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const position = (code: string) => parameters.findIndex((p) => p.code === code)
  const unit = (code: string) => parameters.find((p) => p.code === code)?.unit ?? ''

  return (
    <div className="flex flex-col gap-6">
      {days.map((day) => (
        <section key={day.day} className="flex flex-col gap-1">
          <SectionHeader title={formatDay(day.day, language)} level={3} size="sm" />
          <ol className="m-0 flex list-none flex-col p-0">
            {day.entries.map((entry, i) => {
              if (entry.kind === 'maintenance') {
                return (
                  <MaintenanceEntry
                    key={`c${entry.entry.id}`}
                    entry={entry.entry}
                    index={i}
                    netVolumeLiters={tank.netVolumeLiters}
                    size="md"
                  />
                )
              }
              if (entry.kind === 'photo') {
                return (
                  <li key={`p${entry.photo.id}`} className="grid grid-cols-[96px_1fr] gap-4 border-b border-dashed border-ink/45 py-3">
                    <PhotoCard tank={tank} photo={entry.photo} index={i} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-mono text-xs tracking-[0.08em] text-ink-muted uppercase">
                        {t('photos.historyLabel')} · {formatMoment(entry.photo.takenAt, language)}
                      </span>
                      {entry.photo.note && <span className="text-ink-soft [overflow-wrap:anywhere]">{entry.photo.note}</span>}
                    </div>
                  </li>
                )
              }
              // Adding a kind to HistoryEntry makes this line a type error until it has its own branch.
              entry satisfies { kind: 'measurements' }
              return (
                <li key={`m${entry.group.items[0].id}`} className="flex flex-col gap-1 border-b border-dashed border-ink/45 py-3">
                  <span className="font-mono text-xs tracking-[0.08em] text-ink-muted uppercase">
                    {t('timeline.history.measured')} · {formatMoment(entry.group.measuredAt, language)}
                  </span>
                  <span className="text-[1.0625rem]">
                    {[...entry.group.items]
                      .sort((a, b) => position(a.parameter) - position(b.parameter))
                      .map((m) => {
                        const u = unit(m.parameter)
                        return `${t(`parameters.${m.parameter}`)} ${formatNumber(m.value, language, { maxDecimals: valueDecimals })}${u ? ` ${u}` : ''}`
                      })
                      .join(' · ')}
                  </span>
                  {entry.group.note && <span className="text-ink-soft [overflow-wrap:anywhere]">{entry.group.note}</span>}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../../components/ui/Structure'
import { buildHistory, type HistoryDay } from '../../tanks/history'
import type { Maintenance } from '../../tanks/maintenance'
import type { Measurement, Parameter } from '../../tanks/measurements'
import type { Photo } from '../../tanks/photos'
import { PhotoViewer } from '../../tanks/PhotoViewer'
import type { TimelinePeriod } from '../../tanks/series'
import type { Tank } from '../../tanks/types'
import { useLanguage } from '../../tanks/useLanguage'
import { Calendar } from './Calendar'
import { DayEntry } from './DayEntry'
import { changesById } from './shared'
import { Summary } from './Summary'

/** A day on the calendar is this wide, in pixels, until the period is too long to fit. */
const dayWidth = 36

/**
 * The tank's own timeline: a calendar of the period with the numbers that matter beside it, and under them every day
 * of that period, newest first, with what was measured, done and photographed. The calendar's days jump to their
 * entry, so it is both the map and the index of the list.
 */
export function Journal({
  period,
  measurements,
  maintenance,
  photos,
  parameters,
  tank,
  from,
  now,
}: {
  period: TimelinePeriod
  measurements: Measurement[]
  maintenance: Maintenance[]
  photos: Photo[]
  parameters: Parameter[]
  tank: Pick<Tank, 'id' | 'name' | 'netVolumeLiters' | 'readOnly'>
  from: Date | null
  now: Date
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [picked, setPicked] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Photo | null>(null)
  const start = from?.getTime() ?? -Infinity
  const days = useMemo(
    () =>
      buildHistory(
        measurements.filter((m) => Date.parse(m.measuredAt) >= start),
        maintenance.filter((m) => Date.parse(m.performedAt) >= start),
        photos.filter((p) => Date.parse(p.takenAt) >= start),
      ),
    [measurements, maintenance, photos, start],
  )
  const changes = useMemo(() => changesById(measurements), [measurements])

  if (days.length === 0) return <p className="m-0 max-w-[46ch] text-lead text-ink-soft">{t('timeline.history.empty')}</p>

  const months: { key: string; label: string; days: HistoryDay[] }[] = []
  const monthFormat = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  for (const day of days) {
    const key = day.day.slice(0, 7)
    const last = months[months.length - 1]
    if (last?.key === key) last.days.push(day)
    else {
      const [year, month] = key.split('-').map(Number)
      months.push({ key, label: monthFormat.format(new Date(Date.UTC(year, month - 1, 1))), days: [day] })
    }
  }
  const pick = (key: string) => {
    setPicked(key)
    document.getElementById(`d-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-x-10 gap-y-8 min-[900px]:grid-cols-[minmax(0,max-content)_minmax(280px,1fr)]">
        <Calendar days={days} from={from} now={now} cell={dayWidth} selected={picked} onPick={pick} />
        <Summary days={days} now={now} measurements={measurements} maintenance={maintenance} photos={photos} />
      </div>
      <section className="flex flex-col gap-6">
        <SectionHeader
          title={t(`timeline.periodTitle.${period}`)}
          size="sm"
          aside={<span className="text-ink-muted">{t('timeline.daysWithRecords', { count: days.length })}</span>}
        />
        {months.map((month) => (
          <div key={month.key} className="flex flex-col">
            <h3 className="m-0 mb-4 flex items-center gap-4 font-mono text-label font-normal tracking-[0.12em] text-ink-muted uppercase after:h-px after:flex-1 after:bg-ink/25">
              {month.label}
            </h3>
            {month.days.map((day) => (
              <DayEntry key={day.day} day={day} parameters={parameters} changes={changes} tank={tank} onOpenPhoto={setViewing} />
            ))}
          </div>
        ))}
      </section>
      {viewing && <PhotoViewer tank={tank} photos={[viewing]} onClose={() => setViewing(null)} />}
    </div>
  )
}

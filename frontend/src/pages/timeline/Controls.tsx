import { useTranslation } from 'react-i18next'
import { Segmented } from '../../components/ui/Chip'
import type { Change } from '../../tanks/latest'
import { valueDecimals } from '../../tanks/measurements'
import { formatNumber } from '../../tanks/numbers'
import { useLanguage } from '../../tanks/useLanguage'
import type { Marker } from '../../tanks/history'
import { periods, type TimelinePeriod } from '../../tanks/series'
import { changeSymbols, isWaterChange } from './shared'

/** The period as one squared switch, like the view switch above it: the whole page has one kind of control. */
export function PeriodSwitch({ period, onChange }: { period: TimelinePeriod; onChange: (period: TimelinePeriod) => void }) {
  const { t } = useTranslation()
  return (
    <Segmented
      label={t('timeline.period')}
      value={period}
      onChange={onChange}
      options={periods.map((p) => ({ value: p, label: t(`timeline.periodsShort.${p}`) }))}
      className="w-fit max-w-full overflow-x-auto"
    />
  )
}

/** What the marks on the axes mean. A water change is a blue diamond and other care an ink square. */
export function CareLegend({ markers }: { markers: readonly Marker[] }) {
  const { t } = useTranslation()
  if (markers.length === 0) return null
  const hasOther = markers.some((m) => !isWaterChange(m))
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-caption text-ink-muted">
      <span className="inline-flex items-center gap-1.5">
        <svg width="10" height="10" viewBox="-5 -5 10 10" aria-hidden="true">
          <path d="M0 -4.5 l4.5 4.5 l-4.5 4.5 l-4.5 -4.5 z" className="fill-neon" />
        </svg>
        {t('maintenance.types.water_change')}
      </span>
      {hasOther && (
        <span className="inline-flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="-5 -5 10 10" aria-hidden="true">
            <rect x="-3" y="-3" width="6" height="6" className="fill-ink-muted" />
          </svg>
          {t('timeline.care')}
        </span>
      )}
    </p>
  )
}

/** How a value moved since the previous one: a symbol and the amount, with the sentence for a screen reader. */
export function Delta({ change, className }: { change: Change; className?: string }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const amount = formatNumber(change.amount, language, { maxDecimals: valueDecimals })
  return (
    <span className={className}>
      <span aria-hidden="true">
        {changeSymbols[change.direction]}
        {change.direction !== 'same' && ` ${amount}`}
      </span>
      <span className="sr-only">{t(`measurements.latest.${change.direction}`, { amount })}</span>
    </span>
  )
}

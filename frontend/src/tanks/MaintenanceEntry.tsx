import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Handwritten } from '../components/ui/Paper'
import { Stamp } from '../components/ui/Stamp'
import { cx } from '../lib/cx'
import { litersOf, stampTones, type Maintenance } from './maintenance'
import { formatMoment } from './measurements'
import { formatNumber } from './numbers'
import { useLanguage } from './useLanguage'

/** The stamps are turned by hand, each a little differently. */
const turns = [-10, 6, -4, 8, -7]

/**
 * One Maintenance as a row of the log: its stamp, when it was done and what, and the note. With `editTo`, a link
 * to edit it. A Water Change shows the liters when the tank's Net Volume is known.
 */
export function MaintenanceEntry({
  entry,
  index,
  netVolumeLiters,
  size = 'lg',
  editTo,
}: {
  entry: Maintenance
  index: number
  netVolumeLiters: number | null
  size?: 'md' | 'lg'
  editTo?: string
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const isWaterChange = entry.type === 'water_change' && entry.percent !== null
  const percent = isWaterChange ? formatNumber(entry.percent!, language) : ''
  const liters = isWaterChange && netVolumeLiters !== null ? litersOf(entry.percent!, netVolumeLiters) : null
  const type = t(`maintenance.types.${entry.type}`)
  const moment = formatMoment(entry.performedAt, language)

  return (
    <li
      className={cx(
        'grid gap-4 border-b border-dashed border-ink/45',
        size === 'lg' ? 'grid-cols-[96px_1fr] py-4.5' : 'grid-cols-[74px_1fr] py-3',
      )}
    >
      {/* The words beside it say the same, so the stamp is only for the eye. */}
      <span aria-hidden="true" className="flex items-center justify-center">
        <Stamp
          tone={stampTones[entry.type]}
          size={size === 'lg' ? 'lg' : 'md'}
          rotate={turns[index % turns.length]}
          top={isWaterChange ? t('maintenance.stamps.water_change') : undefined}
          main={isWaterChange ? `${percent}%` : t(`maintenance.stamps.${entry.type}`)}
          bottom={liters !== null ? t('maintenance.liters', { value: formatNumber(liters, language) }) : undefined}
        />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-xs tracking-[0.08em] text-ink-muted uppercase">{moment}</span>
        <span className="text-[1.1875rem]">
          {type}
          {isWaterChange && ` · ${t('maintenance.percentOfWater', { percent })}`}
        </span>
        {entry.note && (
          <Handwritten as="p" size="sm" className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
            {entry.note}
          </Handwritten>
        )}
        {editTo && (
          <Link
            to={editTo}
            aria-label={t('maintenance.list.editLabel', { type, moment })}
            className="inline-flex min-h-11 items-center self-start font-mono text-[0.78125rem]"
          >
            {t('maintenance.list.edit')}
          </Link>
        )}
      </div>
    </li>
  )
}

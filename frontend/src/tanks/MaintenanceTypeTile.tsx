import { useTranslation } from 'react-i18next'
import { Stamp } from '../components/ui/Stamp'
import { cx } from '../lib/cx'
import { stampTones, type MaintenanceType } from './maintenance'

/**
 * A kind of Maintenance to pick, shown as the same stamp the log uses: muted and dashed while it is off, in its
 * own colour once it is picked. The words stay under it, and the tick and the firm border say "picked" without colour.
 */
export function MaintenanceTypeTile({
  type,
  pressed,
  onClick,
}: {
  type: MaintenanceType
  pressed: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        'flex min-h-11 cursor-pointer flex-col items-center gap-2 px-1 py-3 text-center transition-colors',
        pressed ? 'border-[1.5px] border-ink bg-paper-card' : 'border border-dashed border-ink/50 hover:bg-paper-card',
      )}
    >
      <span aria-hidden="true" className={cx('transition-opacity', !pressed && 'opacity-60')}>
        <Stamp
          tone={pressed ? stampTones[type] : 'muted'}
          dashed={!pressed}
          size="lg"
          rotate={pressed ? -6 : 0}
          main={t(`maintenance.stamps.${type}`)}
        />
      </span>
      <span className="font-mono text-label text-ink">
        {pressed && <span aria-hidden="true">✓ </span>}
        {t(`maintenance.types.${type}`)}
      </span>
    </button>
  )
}

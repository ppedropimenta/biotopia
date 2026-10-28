import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Icon } from '../components/ui/Icon'
import { formatNumber } from './numbers'
import type { Tank } from './types'
import { useLanguage } from './useLanguage'

/** The dark head of the measurement forms: a way back, the title, and the tank's name and Net Volume. */
export function MeasurementHeader({ tank, title }: { tank: Pick<Tank, 'id' | 'name' | 'netVolumeLiters'>; title: string }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const about = [
    tank.name,
    tank.netVolumeLiters !== null && t('tanks.plate.volume', { value: formatNumber(tank.netVolumeLiters, language) }),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <header className="flex items-center gap-2 texture-river py-3.5 pr-3 pl-1.5 text-river-bright">
      <Link
        to={`/tanks/${tank.id}`}
        aria-label={t('measurements.form.back', { name: tank.name })}
        className="flex size-11 flex-none items-center justify-center text-river-bright"
      >
        <Icon name="arrowLeft" size={22} strokeWidth={2} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="m-0 text-[1.375rem] leading-[1.1] font-normal">{title}</h1>
        <span className="truncate font-mono text-[0.71875rem] text-amber-soft">{about}</span>
      </div>
    </header>
  )
}

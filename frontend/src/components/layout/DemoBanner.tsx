import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../ui/Button'
import { Stamp } from '../ui/Stamp'

/** Says a tank is read-only and where to start one's own. `to` is the sign-up for a visitor. */
export function DemoBanner({ to }: { to: string }) {
  const { t } = useTranslation()
  return (
    <div role="note" className="flex flex-wrap items-center gap-x-5.5 gap-y-3 rounded-paper bg-ink px-5 py-3.5 text-river-bright">
      <Stamp tone="amber" size="md" rotate={-10} main={t('demo.stamp')} />
      <span className="flex-[1_1_360px] text-base">{t('demo.banner')}</span>
      <ButtonLink to={to} variant="amber">
        {t('demo.createOwn')}
      </ButtonLink>
    </div>
  )
}

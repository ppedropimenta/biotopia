import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../auth/api'
import { fieldButton, paperButton } from '../auth/classes'
import { useAuth } from '../auth/context'
import { formatDay } from '../tanks/dates'
import { formatNumber } from '../tanks/numbers'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

export function TanksPage() {
  const { t } = useTranslation()
  const { state } = useAuth()
  const tanks = useLoad(api.tanks, 'tanks')

  return (
    <div className="px-5 pt-10 pb-24 sm:px-8 lg:pt-16">
      <div className="rise flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div>
          <h1 className="font-display text-[clamp(40px,6vw,88px)] leading-[0.95] tracking-[-0.02em]">
            {t('tanks.title')}
          </h1>
          {state.status === 'in' && <p className="mt-4 text-[15px] text-muted">{state.account.email}</p>}
        </div>
        {tanks.status === 'ready' && tanks.data.length > 0 && (
          <Link to="/tanks/new" className={paperButton}>
            {t('tanks.new')}
          </Link>
        )}
      </div>

      {tanks.status === 'error' && (
        <p role="alert" className="rise mt-10 text-[18px] text-negative">
          {t('tanks.loadFailed')}
        </p>
      )}
      {tanks.status === 'ready' && tanks.data.length === 0 && <EmptyState />}
      {tanks.status === 'ready' && tanks.data.length > 0 && (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tanks.data.map((tank) => (
            <li key={tank.id} className="rise">
              <TankCard tank={tank} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <section className="rise mt-10 bg-tannin p-8 text-on-tannin sm:p-12">
      <h2 className="font-display text-[clamp(30px,4vw,56px)] leading-tight italic">{t('tanks.empty.title')}</h2>
      <p className="mt-4 max-w-[46ch] text-[18px] leading-relaxed">{t('tanks.empty.text')}</p>
      <Link to="/tanks/new" className={`${fieldButton} mt-8`}>
        {t('tanks.empty.cta')}
      </Link>
    </section>
  )
}

/** One tank on a blackwater card: its name and age, and the Net Volume as the figure. Photos will join it later. */
function TankCard({ tank }: { tank: Tank }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const hasSize = tank.lengthCm !== null && tank.widthCm !== null && tank.heightCm !== null

  return (
    <Link
      to={`/tanks/${tank.id}`}
      className="flex h-full min-h-64 flex-col justify-between gap-8 bg-tannin p-6 text-on-tannin transition-colors hover:bg-tannin-3"
    >
      <div>
        <h2 className="font-display text-[30px] leading-tight italic [overflow-wrap:anywhere]">{tank.name}</h2>
        <p className="mt-2 text-[15px] text-on-tannin-muted">
          {t('tanks.since', { date: formatDay(tank.startDate, language) })}
        </p>
      </div>
      <div>
        {tank.netVolumeLiters === null ? (
          <p className="text-[15px] text-on-tannin-muted">{t('tanks.netVolumeUnset')}</p>
        ) : (
          <>
            <p className="text-[15px] text-on-tannin-muted">{t('tanks.netVolume')}</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[56px] leading-none text-neon-glow tabular-nums">
                {formatNumber(tank.netVolumeLiters, language)}
              </span>
              <span className="text-[15px] text-on-tannin-muted">{t('tanks.liters')}</span>
            </p>
          </>
        )}
        {hasSize && (
          <p className="mt-3 text-[15px] text-on-tannin-muted tabular-nums">
            {t('tanks.size', {
              length: formatNumber(tank.lengthCm!, language),
              width: formatNumber(tank.widthCm!, language),
              height: formatNumber(tank.heightCm!, language),
            })}
          </p>
        )}
      </div>
    </Link>
  )
}

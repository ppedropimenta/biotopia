import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { api } from '../auth/api'
import { paperButton } from '../auth/classes'
import { formatDay } from '../tanks/dates'
import { LoadError } from '../tanks/LoadError'
import { formatNumber } from '../tanks/numbers'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** One tank. For now it shows the details; the logbook grows on this page in the next tickets. */
export function TankPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const { id = '' } = useParams()
  const tank = useLoad(() => api.tank(id), id)

  if (tank.status === 'loading') return null
  if (tank.status === 'error') {
    return (
      <div className="px-5 pt-10 pb-24 sm:px-8 lg:pt-16">
        <BackLink />
        <div className="mt-8">
          <LoadError error={tank.error} />
        </div>
      </div>
    )
  }

  const { data } = tank
  const figure = (value: number | null, unit: string) =>
    value === null ? (
      <span className="font-display text-[30px] text-on-tannin-muted">—</span>
    ) : (
      <>
        <span className="font-display text-[clamp(40px,5vw,64px)] leading-none text-neon tabular-nums">
          {formatNumber(value, language)}
        </span>{' '}
        <span className="text-[15px] text-on-tannin-muted">{unit}</span>
      </>
    )

  return (
    <>
      <div className="px-5 pt-10 pb-14 sm:px-8 lg:pt-16">
        <BackLink />
        <div className="rise mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div>
            <h1 className="font-display text-[clamp(40px,7vw,104px)] leading-[0.95] tracking-[-0.02em] [overflow-wrap:anywhere]">
              {data.name}
            </h1>
            <p className="mt-4 text-[18px]">{t('tanks.since', { date: formatDay(data.startDate, language) })}</p>
          </div>
          <Link to={`/tanks/${data.id}/edit`} className={paperButton}>
            {t('tanks.page.edit')}
          </Link>
        </div>
      </div>

      <section className="mb-16 bg-tannin px-5 py-14 text-on-tannin sm:px-8 lg:mb-24 lg:py-20">
        <h2 className="rise font-display text-[30px] italic">{t('tanks.page.details')}</h2>
        <dl className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label={t('tanks.netVolume')}>{figure(data.netVolumeLiters, t('tanks.liters'))}</Detail>
          <Detail label={t('tanks.page.length')}>{figure(data.lengthCm, t('tanks.page.cm'))}</Detail>
          <Detail label={t('tanks.page.width')}>{figure(data.widthCm, t('tanks.page.cm'))}</Detail>
          <Detail label={t('tanks.page.height')}>{figure(data.heightCm, t('tanks.page.cm'))}</Detail>
        </dl>
        {data.note && (
          <div className="mt-12 max-w-[60ch]">
            <h3 className="text-[15px] text-on-tannin-muted">{t('tanks.page.note')}</h3>
            <p className="mt-2 text-[18px] leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{data.note}</p>
          </div>
        )}
      </section>
    </>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rise">
      <dt className="text-[15px] text-on-tannin-muted">{label}</dt>
      <dd className="mt-2">{children}</dd>
    </div>
  )
}

function BackLink() {
  const { t } = useTranslation()
  return (
    <Link to="/tanks" className="rise text-[15px] underline underline-offset-4 hover:text-muted">
      ← {t('tanks.page.back')}
    </Link>
  )
}

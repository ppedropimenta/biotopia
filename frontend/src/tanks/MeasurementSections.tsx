import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../auth/api'
import { fieldButton } from '../auth/classes'
import { formatMoment, groupByMoment, valueDecimals, type Measurement, type Parameter } from './measurements'
import { formatNumber } from './numbers'
import type { Language } from '../i18n/language'
import { useLanguage } from './useLanguage'
import { useLoad } from './useLoad'

/** How many of the newest Measurements the tank page lists; the whole history is for a later screen. */
const recentCount = 60

/**
 * The tank page's water: the latest value of each Parameter on a blackwater field, then the recent Measurements
 * on paper, each with a way to edit it.
 */
export function MeasurementSections({ tankId }: { tankId: string }) {
  const { t } = useTranslation()
  const loaded = useLoad(
    () => Promise.all([api.parameters(), api.latestMeasurements(tankId), api.measurements(tankId, recentCount)]),
    `water-${tankId}`,
  )

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <p role="alert" className="px-5 pb-14 text-[18px] text-negative sm:px-8">
        {t('measurements.latest.loadFailed')}
      </p>
    )
  }
  const [parameters, latest, recent] = loaded.data
  return (
    <>
      <LatestValues tankId={tankId} parameters={parameters} latest={latest} />
      <RecentMeasurements tankId={tankId} parameters={parameters} recent={recent} />
    </>
  )
}

/** A Measurement's value the way the language writes it, with the decimals a reading can have. */
const shown = (measurement: Measurement, language: Language) =>
  formatNumber(measurement.value, language, { maxDecimals: valueDecimals })

function unitOf(parameters: Parameter[], measurement: Measurement): string {
  return parameters.find((p) => p.code === measurement.parameter)?.unit ?? ''
}

function LatestValues({ tankId, parameters, latest }: { tankId: string; parameters: Parameter[]; latest: Measurement[] }) {
  const { t } = useTranslation()
  const language = useLanguage()
  return (
    <section className="bg-tannin px-5 py-14 text-on-tannin sm:px-8 lg:py-20">
      <h2 className="rise font-display text-[30px] italic">{t('measurements.latest.title')}</h2>
      {latest.length === 0 ? (
        <div className="rise mt-8 max-w-[46ch]">
          <p className="text-[18px] leading-relaxed">{t('measurements.latest.empty')}</p>
          <Link to={`/tanks/${tankId}/measure`} className={`${fieldButton} mt-8`}>
            {t('measurements.latest.emptyCta')}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((measurement) => (
            <li key={measurement.id} className="rise">
              <p className="text-[15px] text-on-tannin-muted">{t(`parameters.${measurement.parameter}`)}</p>
              <p className="mt-2">
                <span className="font-display text-[clamp(40px,5vw,64px)] leading-none text-neon tabular-nums">
                  {shown(measurement, language)}
                </span>{' '}
                <span className="text-[15px] text-on-tannin-muted">{unitOf(parameters, measurement)}</span>
              </p>
              <p className="mt-2 text-[15px] text-on-tannin-muted">
                {t('measurements.latest.measured', { moment: formatMoment(measurement.measuredAt, language) })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RecentMeasurements({ tankId, parameters, recent }: { tankId: string; parameters: Parameter[]; recent: Measurement[] }) {
  const { t } = useTranslation()
  const language = useLanguage()
  // The API lists values of one moment in no set order; the Parameter list gives the order to read them in.
  const position = (measurement: Measurement) => parameters.findIndex((p) => p.code === measurement.parameter)
  const groups = groupByMoment(recent).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => position(a) - position(b)),
  }))

  return (
    <section className="px-5 py-14 sm:px-8 lg:py-20">
      <h2 className="rise font-display text-[30px] italic">{t('measurements.recent.title')}</h2>
      {groups.length === 0 ? (
        <p className="rise mt-6 max-w-[46ch] text-[18px] leading-relaxed">{t('measurements.recent.empty')}</p>
      ) : (
        <ul className="mt-8 grid items-start gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <li key={`${group.measuredAt}-${group.note}`} className="rise bg-paper-deep p-6">
              <h3 className="text-[18px] font-medium">{formatMoment(group.measuredAt, language)}</h3>
              <ul className="mt-4 grid gap-2">
                {group.items.map((measurement) => {
                  const parameter = t(`parameters.${measurement.parameter}`)
                  const moment = formatMoment(measurement.measuredAt, language)
                  return (
                    <li key={measurement.id} className="flex items-baseline justify-between gap-4 text-[18px]">
                      <span>{parameter}</span>
                      <span className="flex items-baseline gap-4">
                        <span className="tabular-nums">
                          {shown(measurement, language)} {unitOf(parameters, measurement)}
                        </span>
                        <Link
                          to={`/tanks/${tankId}/measurements/${measurement.id}/edit`}
                          aria-label={t('measurements.recent.editLabel', { parameter, moment })}
                          className="text-[15px] underline underline-offset-4 hover:text-muted"
                        >
                          {t('measurements.recent.edit')}
                        </Link>
                      </span>
                    </li>
                  )
                })}
              </ul>
              {group.note && <p className="mt-4 text-[15px] whitespace-pre-line [overflow-wrap:anywhere]">{group.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

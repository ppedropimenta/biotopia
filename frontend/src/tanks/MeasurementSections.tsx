import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../auth/api'
import { ParamTile } from '../components/ui/Measures'
import { Handwritten } from '../components/ui/Paper'
import { SectionHeader } from '../components/ui/Structure'
import type { Language } from '../i18n/language'
import { latestValues, type Change, type LatestValue } from './latest'
import { formatMoment, groupByMoment, valueDecimals, type Measurement, type Parameter } from './measurements'
import { formatNumber } from './numbers'
import { useLanguage } from './useLanguage'
import { useLoad } from './useLoad'

/** How many of the newest Measurements the table lists; the whole history is for a later screen. */
const tableCount = 60

/** The most the API lists. The table shows fewer, but the change since the previous value needs the older ones. */
const historyCount = 1000

const dashedCard =
  'flex min-h-30 flex-col items-center justify-center gap-1.5 border-[1.5px] border-dashed border-ink/55 p-3 text-center text-ink-soft no-underline hover:text-ink'

/**
 * The tank page's water: the latest value of each Parameter with how it changed, then the Measurements in a table,
 * each with a way to edit it.
 */
export function MeasurementSections({ tankId }: { tankId: string }) {
  const { t } = useTranslation()
  const loaded = useLoad(
    () => Promise.all([api.parameters(), api.latestMeasurements(tankId), api.measurements(tankId, historyCount)]),
    `water-${tankId}`,
  )

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <p role="alert" className="m-0 text-lead text-cardinal">
        {t('measurements.latest.loadFailed')}
      </p>
    )
  }
  const [parameters, latest, history] = loaded.data
  return (
    <>
      <LatestMeasurement tankId={tankId} values={latestValues(parameters, latest, history)} />
      <MeasurementsTable tankId={tankId} parameters={parameters} measurements={history.slice(0, tableCount)} />
    </>
  )
}

/** A Measurement's value the way the language writes it, with the decimals a reading can have. */
const shown = (value: number, language: Language) => formatNumber(value, language, { maxDecimals: valueDecimals })

const symbols = { up: '▲', down: '▼', same: '=' } as const

/** The symbol, the amount and the sentence a screen reader gets: the change is never only a colour or a shape. */
function describeChange(change: Change, language: Language, t: TFunction) {
  const amount = shown(change.amount, language)
  return { symbol: symbols[change.direction], text: amount, label: t(`measurements.latest.${change.direction}`, { amount }) }
}

function LatestMeasurement({ tankId, values }: { tankId: string; values: LatestValue[] }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const measure = `/tanks/${tankId}/measure`

  return (
    <section className="flex flex-col gap-3.5">
      <SectionHeader
        title={t('measurements.latest.title')}
        aside={values.length > 0 && <span className="text-xs text-ink-muted">{t('measurements.latest.legend')}</span>}
      />
      {values.length === 0 ? (
        <Link to={measure} className={dashedCard}>
          <span aria-hidden="true" className="text-2xl leading-none">
            +
          </span>
          <span className="text-[1.0625rem]">{t('measurements.latest.empty')}</span>
          <span className="font-mono text-[0.78125rem] text-ink">{t('measurements.latest.emptyCta')}</span>
        </Link>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(176px,100%),1fr))] gap-3">
          {values.map(({ measurement, parameter, change }) => {
            const name = t(`parameters.${measurement.parameter}`)
            const value = shown(measurement.value, language)
            return (
              <ParamTile
                key={measurement.id}
                name={name}
                value={value}
                unit={parameter.unit}
                change={change ? describeChange(change, language, t) : undefined}
                scale={[parameter.min, parameter.max]}
                rulerValue={measurement.value}
                rulerLabel={t('measurements.latest.rulerLabel', {
                  parameter: name,
                  value: `${value} ${parameter.unit}`.trim(),
                  min: shown(parameter.min, language),
                  max: shown(parameter.max, language),
                })}
                note={t('measurements.latest.measured', { moment: formatMoment(measurement.measuredAt, language) })}
              />
            )
          })}
          <Link to={measure} className={dashedCard}>
            <span aria-hidden="true" className="text-2xl leading-none">
              +
            </span>
            <span className="text-[1.0625rem]">{t('measurements.latest.another')}</span>
          </Link>
        </div>
      )}
    </section>
  )
}

const headCell = 'pt-3.5 pb-2.5 font-normal'

function MeasurementsTable({
  tankId,
  parameters,
  measurements,
}: {
  tankId: string
  parameters: Parameter[]
  measurements: Measurement[]
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  // The API lists values of one moment in no set order; the Parameter list gives the order to read them in.
  const position = (measurement: Measurement) => parameters.findIndex((p) => p.code === measurement.parameter)
  const groups = groupByMoment(measurements).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => position(a) - position(b)),
  }))

  return (
    <section className="flex flex-col gap-3.5">
      <SectionHeader title={t('measurements.recent.title')} />
      {groups.length === 0 ? (
        <p className="m-0 max-w-[46ch] text-lead text-ink-soft">{t('measurements.recent.empty')}</p>
      ) : (
        <div className="overflow-x-auto border border-ink texture-card">
          <table className="w-full min-w-[520px] border-collapse text-base">
            <thead>
              <tr className="text-left font-mono text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase">
                <th scope="col" className={`w-[250px] px-4.5 ${headCell}`}>
                  {t('measurements.recent.moment')}
                </th>
                <th scope="col" className={`px-2.5 ${headCell}`}>
                  {t('measurements.recent.parameter')}
                </th>
                <th scope="col" className={`px-2.5 text-right ${headCell}`}>
                  {t('measurements.recent.value')}
                </th>
                <th scope="col" className={`px-4.5 ${headCell}`}>
                  <span className="sr-only">{t('measurements.recent.actions')}</span>
                </th>
              </tr>
            </thead>
            {groups.map((group) => {
              const moment = formatMoment(group.measuredAt, language)
              return (
                <tbody key={`${group.measuredAt}-${group.note}`} className="border-t border-ink/35">
                  {group.items.map((measurement, i) => {
                    const parameter = t(`parameters.${measurement.parameter}`)
                    const unit = parameters.find((p) => p.code === measurement.parameter)?.unit ?? ''
                    return (
                      <tr key={measurement.id} className="align-top">
                        {i === 0 && (
                          <th scope="rowgroup" rowSpan={group.items.length} className="px-4.5 py-3 text-left align-top font-normal">
                            <span className="font-mono text-[0.8125rem]">{moment}</span>
                            {group.note && (
                              <Handwritten as="p" size="sm" className="m-0 mt-1 whitespace-pre-line [overflow-wrap:anywhere]">
                                {group.note}
                              </Handwritten>
                            )}
                          </th>
                        )}
                        <td className="px-2.5 py-2.5">{parameter}</td>
                        <td className="px-2.5 py-2.5 text-right tabular-nums">
                          {shown(measurement.value, language)} {unit}
                        </td>
                        <td className="px-4.5 py-2.5 text-right">
                          <Link
                            to={`/tanks/${tankId}/measurements/${measurement.id}/edit`}
                            aria-label={t('measurements.recent.editLabel', { parameter, moment })}
                            className="font-mono text-[0.78125rem]"
                          >
                            {t('measurements.recent.edit')}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              )
            })}
          </table>
        </div>
      )}
    </section>
  )
}

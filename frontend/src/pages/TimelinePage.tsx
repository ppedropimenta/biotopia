import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { api } from '../auth/api'
import { Segmented } from '../components/ui/Chip'
import { PageHeader } from '../components/ui/Structure'
import { LoadError } from '../tanks/LoadError'
import { formatMoment, valueDecimals } from '../tanks/measurements'
import { formatNumber } from '../tanks/numbers'
import { buildPanels, momentsOf, periods, periodStart, type Panel, type TimelinePeriod } from '../tanks/series'
import { returnHere } from '../tanks/returnTo'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'
import { PeriodSwitch } from './timeline/Controls'
import { Journal } from './timeline/Journal'
import { ParameterBoard } from './timeline/ParameterBoard'

/** The most the API lists. A tank with more than this shows its newest ones. */
const historyCount = 1000

const defaultPeriod: TimelinePeriod = 'w12'

const isPeriod = (value: string | null): value is TimelinePeriod => periods.includes(value as TimelinePeriod)

const views = ['diary', 'chart', 'table'] as const
type View = (typeof views)[number]
const isView = (value: string | null): value is View => views.includes(value as View)

/**
 * A tank over time, in three views of the same period: the journal (a calendar and every day), the chart of one
 * Parameter with the care around it, and a table with the same numbers. The period and the view are in the address.
 */
export function TimelinePage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const loaded = useLoad(async () => {
    const [tank, parameters, measurements, maintenance, photos] = await Promise.all([
      api.tank(id),
      api.parameters(),
      api.measurements(id, historyCount),
      api.maintenance(id, { limit: historyCount }),
      api.photos(id),
    ])
    return { tank, parameters, measurements, maintenance, photos, now: new Date() }
  }, `timeline-${id}`)

  const crumbs = [{ label: t('ui.nav.myTanks'), to: '/tanks' }]
  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <>
        <PageHeader breadcrumbs={crumbs} title={t('timeline.title')} />
        <LoadError error={loaded.error} />
      </>
    )
  }

  const { tank, parameters, measurements, maintenance, photos, now } = loaded.data
  const requestedPeriod = search.get('period')
  const period = isPeriod(requestedPeriod) ? requestedPeriod : defaultPeriod
  const requestedView = search.get('view')
  const view: View = isView(requestedView) ? requestedView : 'diary'
  // The default period and view stay out of the address, so the plain link is the usual one.
  const change = (name: 'period' | 'view', value: string, usual: string) => {
    const params = new URLSearchParams(search)
    if (value === usual) params.delete(name)
    else params.set(name, value)
    setSearch(params, { replace: true })
  }
  const from = periodStart(period, now)
  const panels = buildPanels(measurements, parameters, from)

  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: tank.name, to: `/tanks/${tank.id}` }, { label: t('timeline.title') }]}
        title={t('timeline.title')}
        subtitle={t('timeline.subtitle', { name: tank.name })}
        actions={
          (panels.length > 0 || maintenance.length > 0 || photos.length > 0) && (
            <Segmented
              label={t('timeline.view')}
              value={view}
              onChange={(next) => change('view', next, 'diary')}
              options={[
                { value: 'diary', label: t('timeline.diaryView') },
                { value: 'chart', label: t('timeline.chartView') },
                { value: 'table', label: t('timeline.tableView') },
              ]}
            />
          )
        }
      />

      <PeriodSwitch period={period} onChange={(next) => change('period', next, defaultPeriod)} />

      {measurements.length === 0 && maintenance.length === 0 && photos.length === 0 ? (
        <Empty tankId={tank.id} anyMeasurements={false} readOnly={tank.readOnly} />
      ) : view === 'diary' ? (
        <Journal
          period={period}
          measurements={measurements}
          maintenance={maintenance}
          photos={photos}
          parameters={parameters}
          tank={tank}
          from={from}
          now={now}
        />
      ) : panels.length === 0 ? (
        <Empty tankId={tank.id} anyMeasurements={measurements.length > 0} readOnly={tank.readOnly} />
      ) : view === 'chart' ? (
        <ParameterBoard panels={panels} measurements={measurements} maintenance={maintenance} photos={photos} tank={tank} now={now} />
      ) : (
        <ValuesTable panels={panels} tank={tank} />
      )}
      {measurements.length >= historyCount && (
        <p className="m-0 text-xs text-ink-muted">{t('timeline.truncated', { count: historyCount })}</p>
      )}
    </>
  )
}

function Empty({ tankId, anyMeasurements, readOnly }: { tankId: string; anyMeasurements: boolean; readOnly: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex max-w-[60ch] flex-col gap-2 text-lead text-ink-soft">
      <p className="m-0">{anyMeasurements ? t('timeline.emptyPeriod') : t('timeline.empty')}</p>
      {!anyMeasurements && !readOnly && (
        <Link to={`/tanks/${tankId}/measure`} className="font-mono text-label text-ink">
          {t('measurements.latest.emptyCta')}
        </Link>
      )}
    </div>
  )
}

/**
 * The chart's numbers as a table: the way to read them exactly, and the one a screen reader gets in full. For the
 * owner each number opens its edit form, which comes back here.
 */
function ValuesTable({ panels, tank }: { panels: Panel[]; tank: Pick<Tank, 'id' | 'readOnly'> }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const back = returnHere(useLocation())
  // Newest first, like the list on the tank page.
  const moments = momentsOf(panels).reverse()
  return (
    <div className="overflow-x-auto border border-ink texture-card">
      <table className="w-full min-w-[560px] border-collapse text-base">
        <caption className="sr-only">{t('timeline.title')}</caption>
        <thead>
          <tr className="text-left font-mono text-caption tracking-[0.12em] text-ink-muted uppercase">
            <th scope="col" className="px-4 pt-3.5 pb-2.5 font-normal">
              {t('timeline.when')}
            </th>
            {panels.map((p) => (
              <th key={p.parameter} scope="col" className="px-3 pt-3.5 pb-2.5 text-right font-normal">
                {t(`parameters.${p.parameter}`)} {p.unit}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {moments.map((moment) => {
            const when = formatMoment(new Date(moment).toISOString(), language)
            return (
              <tr key={moment} className="border-t border-dashed border-ink/40">
                <th scope="row" className="px-4 py-2 text-left font-mono text-sm font-normal">
                  {when}
                </th>
                {panels.map((p) => {
                  const point = p.points.find((q) => q.at === moment)
                  const value = point && formatNumber(point.value, language, { maxDecimals: valueDecimals })
                  return (
                    <td key={p.parameter} className="px-3 py-2 text-right tabular-nums">
                      {!point ? (
                        '—'
                      ) : tank.readOnly ? (
                        value
                      ) : (
                        <Link
                          to={`/tanks/${tank.id}/measurements/${point.id}/edit`}
                          state={back}
                          className="text-ink underline decoration-ink/40 decoration-dotted underline-offset-4 hover:text-ink hover:decoration-ink hover:decoration-solid"
                        >
                          {value}
                        </Link>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

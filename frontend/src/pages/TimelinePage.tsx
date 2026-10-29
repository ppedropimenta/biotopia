import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'
import { api } from '../auth/api'
import { ParameterChart } from '../components/charts/ParameterChart'
import { ChipGroup, Segmented, ToggleChip } from '../components/ui/Chip'
import { PlateCorners } from '../components/ui/Plate'
import { plateClasses } from '../components/ui/plateClasses'
import { PageHeader } from '../components/ui/Structure'
import { buildHistory, markersIn } from '../tanks/history'
import { HistoryList } from '../tanks/HistoryList'
import { LoadError } from '../tanks/LoadError'
import type { Maintenance } from '../tanks/maintenance'
import type { Photo } from '../tanks/photos'
import type { Tank } from '../tanks/types'
import { formatMoment, valueDecimals, type Measurement, type Parameter, type ParameterCode } from '../tanks/measurements'
import { formatNumber } from '../tanks/numbers'
import { buildPanels, momentsOf, periods, periodStart, timeRange, type Panel, type Period } from '../tanks/series'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** The most the API lists. A tank with more than this shows its newest ones. */
const historyCount = 1000

const defaultPeriod: Period = 'w12'

const isPeriod = (value: string | null): value is Period => periods.includes(value as Period)

/** A tank's Parameters over time: a chart per Parameter, a time range to pick and a table with the same numbers. */
export function TimelinePage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const [view, setView] = useState<'chart' | 'table' | 'history'>('chart')
  const [hidden, setHidden] = useState<ReadonlySet<ParameterCode>>(new Set())
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
  const requested = search.get('period')
  const period = isPeriod(requested) ? requested : defaultPeriod
  const from = periodStart(period, now)
  const inPeriod = buildPanels(measurements, parameters, from)
  // Hidden Parameters stay hidden across periods, unless that would leave nothing to draw.
  const unhidden = inPeriod.filter((p) => !hidden.has(p.parameter))
  const panels = unhidden.length > 0 ? unhidden : inPeriod
  const toggle = (parameter: ParameterCode) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(parameter)) next.delete(parameter)
      else if (panels.length > 1) next.add(parameter)
      return next
    })

  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: tank.name, to: `/tanks/${tank.id}` }, { label: t('timeline.title') }]}
        title={t('timeline.title')}
        subtitle={t('timeline.subtitle', { name: tank.name })}
        actions={
          (inPeriod.length > 0 || maintenance.length > 0 || photos.length > 0) && (
            <Segmented
              label={t('timeline.view')}
              value={view}
              onChange={setView}
              options={[
                { value: 'chart', label: t('timeline.chartView') },
                { value: 'table', label: t('timeline.tableView') },
                { value: 'history', label: t('timeline.historyView') },
              ]}
            />
          )
        }
      />

      <div className="flex flex-wrap items-center gap-x-6.5 gap-y-3">
        <ChipGroup label={t('timeline.period')}>
          {periods.map((p) => (
            <ToggleChip
              key={p}
              pressed={period === p}
              onClick={() => setSearch(p === defaultPeriod ? {} : { period: p }, { replace: true })}
            >
              {t(`timeline.periods.${p}`)}
            </ToggleChip>
          ))}
        </ChipGroup>
        {inPeriod.length > 1 && (
          <ChipGroup label={t('timeline.parameters')}>
            {inPeriod.map((p) => (
              <ToggleChip key={p.parameter} variant="check" pressed={panels.includes(p)} onClick={() => toggle(p.parameter)}>
                {t(`parameters.${p.parameter}`)}
              </ToggleChip>
            ))}
          </ChipGroup>
        )}
      </div>

      {view === 'history' ? (
        <History
          measurements={measurements}
          maintenance={maintenance}
          photos={photos}
          parameters={parameters}
          from={from}
          tank={tank}
        />
      ) : panels.length === 0 ? (
        <Empty tankId={tank.id} anyMeasurements={measurements.length > 0} readOnly={tank.readOnly} />
      ) : view === 'chart' ? (
        <ChartPlate panels={panels} maintenance={maintenance} from={from} now={now} />
      ) : (
        <ValuesTable panels={panels} />
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
    <div className="flex max-w-[46ch] flex-col gap-2 text-lead text-ink-soft">
      <p className="m-0">{anyMeasurements ? t('timeline.emptyPeriod') : t('timeline.empty')}</p>
      {!anyMeasurements && !readOnly && (
        <Link to={`/tanks/${tankId}/measure`} className="font-mono text-[0.78125rem] text-ink">
          {t('measurements.latest.emptyCta')}
        </Link>
      )}
    </div>
  )
}

/** Everything that happened in the period, measured or done, day by day. */
function History({
  measurements,
  maintenance,
  photos,
  parameters,
  from,
  tank,
}: {
  measurements: Measurement[]
  maintenance: Maintenance[]
  photos: Photo[]
  parameters: Parameter[]
  from: Date | null
  tank: Tank
}) {
  const { t } = useTranslation()
  const start = from?.getTime() ?? -Infinity
  const days = buildHistory(
    measurements.filter((m) => Date.parse(m.measuredAt) >= start),
    maintenance.filter((m) => Date.parse(m.performedAt) >= start),
    photos.filter((p) => Date.parse(p.takenAt) >= start),
  )
  if (days.length === 0) return <p className="m-0 max-w-[46ch] text-lead text-ink-soft">{t('timeline.history.empty')}</p>
  return <HistoryList days={days} parameters={parameters} tank={tank} />
}

function ChartPlate({
  panels,
  maintenance,
  from,
  now,
}: {
  panels: Panel[]
  maintenance: Maintenance[]
  from: Date | null
  now: Date
}) {
  const { t } = useTranslation()
  const [start, end] = timeRange(panels, from, now)
  const names = panels.map((p) => t(`parameters.${p.parameter}`)).join(', ')
  return (
    <figure className={`${plateClasses('md')} m-0 pb-2.5`}>
      <PlateCorners items={[t('timeline.plate', { count: momentsOf(panels).length })]} />
      <ParameterChart
        className="mt-1.5"
        panels={panels}
        from={start}
        to={end}
        markers={markersIn(maintenance, start, end)}
        description={t('timeline.description', { parameters: names, count: momentsOf(panels).length })}
      />
    </figure>
  )
}

/** The chart's numbers as a table: the way to read them exactly, and the one a screen reader gets in full. */
function ValuesTable({ panels }: { panels: Panel[] }) {
  const { t } = useTranslation()
  const language = useLanguage()
  // Newest first, like the list on the tank page.
  const moments = momentsOf(panels).reverse()
  return (
    <div className="overflow-x-auto border border-ink texture-card">
      <table className="w-full min-w-[560px] border-collapse text-base">
        <caption className="sr-only">{t('timeline.title')}</caption>
        <thead>
          <tr className="text-left font-mono text-[0.6875rem] tracking-[0.12em] text-ink-muted uppercase">
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
          {moments.map((moment) => (
            <tr key={moment} className="border-t border-dashed border-ink/40">
              <th scope="row" className="px-4 py-2 text-left font-mono text-[0.8125rem] font-normal">
                {formatMoment(new Date(moment).toISOString(), language)}
              </th>
              {panels.map((p) => {
                const point = p.points.find((q) => q.at === moment)
                return (
                  <td key={p.parameter} className="px-3 py-2 text-right tabular-nums">
                    {point ? formatNumber(point.value, language, { maxDecimals: valueDecimals }) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

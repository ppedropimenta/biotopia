import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../auth/api'
import { Illustration } from '../components/ui/Brand'
import { ButtonLink } from '../components/ui/Button'
import { Handwritten } from '../components/ui/Paper'
import { PlateCorners } from '../components/ui/Plate'
import { plateClasses } from '../components/ui/plateClasses'
import { Sparkline } from '../components/ui/Measures'
import { PageHeader, SectionHeader } from '../components/ui/Structure'
import { cx } from '../lib/cx'
import { roman } from '../lib/roman'
import { daysAgo, formatDay } from '../tanks/dates'
import type { Maintenance } from '../tanks/maintenance'
import { valueDecimals, type Measurement, type Parameter } from '../tanks/measurements'
import { formatNumber } from '../tanks/numbers'
import type { PhotoSummary } from '../tanks/photos'
import { photoUrl } from '../tanks/photos'
import { plateValues } from '../tanks/plates'
import { recentSeries } from '../tanks/series'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** How many of each tank's newest Measurements are read for the small lines on its plate. */
const sparklineHistory = 100

/** The values a sparkline draws for a Parameter. */
const sparklineValues = 12

type Loaded = { now: Date; tanks: Tank[]; parameters: Parameter[]; latest: Measurement[][]; history: Measurement[][]; lastWaterChange: Array<Maintenance | undefined>; photos: PhotoSummary[] }

/** The tanks and, for each, its latest Measurements and its recent ones: the plates show values and their trend. */
async function loadTanks(): Promise<Loaded> {
  const [tanks, parameters] = await Promise.all([api.tanks(), api.parameters()])
  const [latest, history, lastWaterChange, photos] = await Promise.all([
    Promise.all(tanks.map((tank) => api.latestMeasurements(tank.id))),
    Promise.all(tanks.map((tank) => api.measurements(tank.id, sparklineHistory))),
    Promise.all(tanks.map(async (tank) => (await api.maintenance(tank.id, { type: 'water_change', limit: 1 }))[0])),
    // A tank whose photos cannot be read is shown with its drawing, as one with no photos.
    Promise.all(tanks.map((tank) => api.photoSummary(tank.id).catch((): PhotoSummary => ({ count: 0, latestId: null })))),
  ])
  return { tanks, parameters, latest, history, lastWaterChange, photos, now: new Date() }
}

export function TanksPage() {
  const { t } = useTranslation()
  const loaded = useLoad(loadTanks, 'tanks')

  return (
    <>
      <PageHeader
        title={t('tanks.title')}
        actions={
          <ButtonLink to="/tanks/new" variant="secondary" icon="plus">
            {t('tanks.new')}
          </ButtonLink>
        }
      />

      {loaded.status === 'error' && (
        <p role="alert" className="m-0 text-lead text-cardinal">
          {t('tanks.loadFailed')}
        </p>
      )}
      {loaded.status === 'ready' && (
        <>
          {loaded.data.tanks.length === 0 && <NewPlate first />}
          {loaded.data.tanks.some((tank) => !tank.archivedAt) && (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-7 p-0">
              {loaded.data.tanks.map((tank, i) => tank.archivedAt ? null : (
                <li key={tank.id} className="flex">
                  <TankPlate number={i + 1} tank={tank} parameters={loaded.data.parameters} latest={loaded.data.latest[i]}
                    history={loaded.data.history[i]}
                    lastWaterChange={loaded.data.lastWaterChange[i]}
                    photos={loaded.data.photos[i]}
                    now={loaded.data.now}
                  />
                </li>
              ))}
            </ul>
          )}
          {loaded.data.tanks.length > 0 && <NewPlate />}
          <ArchivedTanks tanks={loaded.data.tanks} />
        </>
      )}
    </>
  )
}

/** One tank as a numbered plate: the drawing, its name and size, and the latest pH, temperature and total ammonia. */
function TankPlate({
  number,
  tank,
  parameters,
  latest,
  history,
  lastWaterChange,
  photos,
  now,
}: {
  number: number
  tank: Tank
  parameters: Parameter[]
  latest: Measurement[]
  history: Measurement[]
  lastWaterChange: Maintenance | undefined
  photos: PhotoSummary
  now: Date
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const facts = [
    tank.netVolumeLiters !== null && t('tanks.plate.volume', { value: formatNumber(tank.netVolumeLiters, language) }),
    tank.lengthCm !== null &&
      tank.widthCm !== null &&
      tank.heightCm !== null &&
      t('tanks.plate.size', {
        length: formatNumber(tank.lengthCm, language),
        width: formatNumber(tank.widthCm, language),
        height: formatNumber(tank.heightCm, language),
      }),
    t('tanks.plate.since', { date: formatDay(tank.startDate, language) }),
  ].filter(Boolean)

  return (
    <Link
      to={`/tanks/${tank.id}`}
      className={cx(plateClasses('md'), 'flex w-full flex-col gap-3.5 no-underline hover:text-ink')}
    >
      <PlateCorners
        items={[`${t('ui.plate.plate')} ${roman(number)}`, ...(photos.count > 0 ? [t('photos.count', { count: photos.count })] : [])]}
      />
      {photos.latestId ? (
        // The latest Tank Photo stands in for the tank, in the same frame as the drawing.
        <img
          src={photoUrl(tank.id, photos.latestId)}
          alt={t('photos.latestAlt', { name: tank.name })}
          loading="lazy"
          className="block aspect-[4/3] w-full object-cover"
        />
      ) : (
        <Illustration slug="blackwater" decorative />
      )}
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 text-[1.6875rem] leading-[1.1] font-medium [overflow-wrap:anywhere]">{tank.name}</h2>
        <span className="font-mono text-[0.78125rem] text-ink-muted">{facts.join(' · ')}</span>
        {lastWaterChange?.percent != null && (
          <span className="font-mono text-[0.78125rem] text-ink-muted">
            {t('maintenance.lastWaterChange', {
              percent: formatNumber(lastWaterChange.percent, language),
              when: daysAgo(lastWaterChange.performedAt, now, language),
            })}
          </span>
        )}
      </div>
      <dl className="m-0 mt-auto grid grid-cols-3 border-y border-ink/35">
        {plateValues(latest).map(({ parameter, value }, i) => (
          <div
            key={parameter}
            className={cx('flex min-w-0 flex-col py-2.5', i === 0 ? 'pr-2' : 'border-l border-dashed border-ink/35 px-2')}
          >
            <dt className={cx('font-mono text-[0.6875rem] text-ink-muted', parameter !== 'ph' && 'uppercase')}>
              {t(`parameters.${parameter}`)} {parameters.find((p) => p.code === parameter)?.unit}
            </dt>
            <dd className="m-0 mt-auto text-2xl leading-[1.1]">
              {value === null ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">{t('tanks.plate.notMeasured')}</span>
                </>
              ) : (
                formatNumber(value, language, { maxDecimals: valueDecimals })
              )}
              <Sparkline values={recentSeries(history, parameter, sparklineValues)} className="mt-1" />
            </dd>
          </div>
        ))}
      </dl>
    </Link>
  )
}

/** "Start a new plate": a dashed card, below the plates or, with no tanks, first and with a handwritten note. */
function NewPlate({ first = false }: { first?: boolean }) {
  const { t } = useTranslation()
  return (
    <Link
      to="/tanks/new"
      className="flex min-h-22 flex-wrap items-center gap-x-6 gap-y-3 border-[1.5px] border-dashed border-ink/55 px-6 py-3.5 text-ink-soft no-underline hover:text-ink"
    >
      <Illustration slug="folhas-secas" decorative fit="contain" className="h-16 w-auto" />
      <span className="text-[1.375rem]">{t('tanks.newPlate')}</span>
      {first ? (
        <Handwritten>{t('tanks.empty')}</Handwritten>
      ) : (
        <span className="font-mono text-[0.78125rem] text-ink-muted">{t('tanks.enough')}</span>
      )}
    </Link>
  )
}

/** Archived tanks, apart from the running ones: a plain list, each a way back into its history. */
function ArchivedTanks({ tanks }: { tanks: Tank[] }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const archived = tanks.filter((tank) => tank.archivedAt)
  if (archived.length === 0) return null
  return (
    <section aria-labelledby="archived-title" className="flex flex-col gap-3 pt-4">
      <SectionHeader title={<span id="archived-title">{t('tanks.lifecycle.archivedTitle')}</span>} level={3} />
      <p className="m-0 text-ink-soft">{t('tanks.lifecycle.archivedHint')}</p>
      <ul className="m-0 flex list-none flex-col p-0">
        {archived.map((tank) => (
          <li key={tank.id} className="border-b border-dashed border-ink/45">
            <Link
              to={`/tanks/${tank.id}`}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-ink no-underline hover:bg-paper-card"
            >
              <span className="text-[1.375rem] [overflow-wrap:anywhere]">{tank.name}</span>
              <span className="font-mono text-[0.78125rem] text-ink-muted">
                {t('tanks.lifecycle.archivedBadge')} · {formatDay(tank.archivedAt!.slice(0, 10), language)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

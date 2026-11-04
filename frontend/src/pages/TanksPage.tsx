import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../auth/api'
import { Illustration } from '../components/ui/Brand'
import { Icon } from '../components/ui/Icon'
import { PlateCorners } from '../components/ui/Plate'
import { plateClasses } from '../components/ui/plateClasses'
import { Sparkline } from '../components/ui/Measures'
import { PageHeader, SectionHeader } from '../components/ui/Structure'
import { cx } from '../lib/cx'
import { roman } from '../lib/roman'
import { useGridColumns } from '../lib/useGridColumns'
import { daysAgo, formatDay } from '../tanks/dates'
import type { Maintenance } from '../tanks/maintenance'
import { valueDecimals, type Measurement, type Parameter } from '../tanks/measurements'
import { formatNumber } from '../tanks/numbers'
import type { PhotoSummary } from '../tanks/photos'
import { TankCover } from '../tanks/TankCover'
import { hasRoomInLastRow, plateValues } from '../tanks/plates'
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
  const running = loaded.status === 'ready' ? loaded.data.tanks.filter((tank) => !tank.archivedAt).length : 0
  // The blank plate takes the free place beside the last plate, however many columns this screen has; with no room
  // there, it is a bar under the grid.
  const [columns, gridRef] = useGridColumns()
  const roomForPlate = hasRoomInLastRow(running, columns)

  return (
    <>
      <PageHeader title={t('tanks.title')} />

      {loaded.status === 'error' && (
        <p role="alert" className="m-0 text-lead text-cardinal">
          {t('tanks.loadFailed')}
        </p>
      )}
      {loaded.status === 'ready' && (
        <>
          {running === 0 && <NewPlate number={loaded.data.tanks.length + 1} layout="bar" />}
          {running > 0 && (
            <ul ref={gridRef} className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-7 p-0">
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
              {roomForPlate && (
                <li className="flex">
                  <NewPlate number={loaded.data.tanks.length + 1} layout="plate" />
                </li>
              )}
            </ul>
          )}
          {running > 0 && !roomForPlate && <NewPlate number={loaded.data.tanks.length + 1} layout="bar" />}
          <ArchivedTanks tanks={loaded.data.tanks} />
        </>
      )}
    </>
  )
}

/** One tank as a numbered plate: the drawing, its name and size, and the latest values of three Parameters (see plateValues). */
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
      className={cx(plateClasses('md'), 'flex w-full flex-col gap-3.5 no-underline transition-[translate] duration-200 ease-out hover:-translate-y-1 hover:text-ink focus-visible:-translate-y-1')}
    >
      <PlateCorners
        items={[`${t('ui.plate.plate')} ${roman(number)}`, ...(photos.count > 0 ? [t('photos.count', { count: photos.count })] : [])]}
      />
      <TankCover tank={tank} number={number} latestPhotoId={photos.latestId} />
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 text-h3 leading-[1.1] font-medium [overflow-wrap:anywhere]">{tank.name}</h2>
        <span className="font-mono text-label text-ink-muted">{facts.join(' · ')}</span>
        {lastWaterChange?.percent != null && (
          <span className="font-mono text-label text-ink-muted">
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
            <dt className={cx('font-mono text-caption text-ink-muted', parameter !== 'ph' && 'uppercase')}>
              {t(`tanks.plate.short.${parameter}`)}
            </dt>
            <dd className="m-0 mt-auto text-2xl leading-[1.1]">
              {value === null ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">{t('tanks.plate.notMeasured')}</span>
                </>
              ) : (
                <>
                  {formatNumber(value, language, { maxDecimals: valueDecimals })}
                  <Unit>{parameters.find((p) => p.code === parameter)?.unit}</Unit>
                </>
              )}
              <Sparkline values={recentSeries(history, parameter, sparklineValues)} className="mt-1" />
            </dd>
          </div>
        ))}
      </dl>
    </Link>
  )
}

/** A Parameter's unit, small and after its value; a Parameter with no unit (pH) shows nothing. */
function Unit({ children }: { children: string | undefined }) {
  if (!children) return null
  return <span className="ml-1 font-mono text-caption text-ink-muted">{children}</span>
}

/**
 * "Start a new plate": a blank plate waiting for its tank. Among one or two plates it is one more plate in the grid
 * (`plate`), with the same corners, picture slot and name as the others; with three or more, or none, it is a bar
 * under them (`bar`), without the button: the whole bar is the link.
 */
function NewPlate({ number, layout }: { number: number; layout: 'plate' | 'bar' }) {
  const { t } = useTranslation()
  const corners = [`${t('ui.plate.plate')} ${roman(number)}`, t('tanks.blank')]
  const action = (
    <span className="inline-flex min-h-11 items-center gap-2 self-start border-[1.5px] border-ink px-4 font-mono text-button tracking-[0.06em] text-ink uppercase transition-colors group-hover:bg-paper-card">
      <Icon name="plus" size={16} strokeWidth={2} />
      {t('tanks.new')}
    </span>
  )
  const frame =
    'group border-[1.5px] border-dashed border-ink/55 text-ink no-underline transition-[translate] duration-200 ease-out hover:-translate-y-1 hover:text-ink focus-visible:-translate-y-1'

  if (layout === 'plate') {
    return (
      <Link to="/tanks/new" className={cx(frame, 'flex w-full flex-col gap-3.5 px-5 pt-4 pb-5')}>
        <PlateCorners items={corners} />
        <div className="flex aspect-[3/2] items-center justify-center border border-dashed border-ink/35">
          <Illustration slug="folhas-secas" decorative fit="contain" className="h-24 w-auto -rotate-6" />
        </div>
        <h2 className="m-0 text-h3 leading-[1.1] font-medium">{t('tanks.newPlate')}</h2>
        <div className="mt-auto pt-1">{action}</div>
      </Link>
    )
  }
  return (
    <Link to="/tanks/new" className={cx(frame, 'flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4')}>
      <Illustration slug="folhas-secas" decorative fit="contain" className="h-16 w-auto -rotate-6" />
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
        <span aria-hidden="true" className="plate-corner">
          {corners.join(' · ')}
        </span>
        <h2 className="m-0 text-h3 leading-[1.1] font-medium">{t('tanks.newPlate')}</h2>
      </div>
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
              <span className="text-h3 [overflow-wrap:anywhere]">{tank.name}</span>
              <span className="font-mono text-label text-ink-muted">
                {t('tanks.lifecycle.archivedBadge')} · {formatDay(tank.archivedAt!.slice(0, 10), language)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

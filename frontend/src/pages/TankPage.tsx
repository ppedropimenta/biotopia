import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../auth/api'
import { ButtonLink } from '../components/ui/Button'
import { Handwritten } from '../components/ui/Paper'
import { PlateCorners } from '../components/ui/Plate'
import { plateClasses } from '../components/ui/plateClasses'
import { Breadcrumbs } from '../components/ui/Structure'
import { roman } from '../lib/roman'
import { formatDay, weeksRunning } from '../tanks/dates'
import { LoadError } from '../tanks/LoadError'
import { MaintenanceDiary } from '../tanks/MaintenanceDiary'
import { TankLifecycle } from '../tanks/TankLifecycle'
import { MeasurementSections } from '../tanks/MeasurementSections'
import { PhotoStrip } from '../tanks/PhotoStrip'
import type { PhotoSummary } from '../tanks/photos'
import { TankCover } from '../tanks/TankCover'
import { formatNumber } from '../tanks/numbers'
import { plateNumber } from '../tanks/plates'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** One tank as its page in the notebook: the drawn plate with the record card, then its water. */
export function TankPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  // Archiving or restoring changes the tank in place, so the page reads it again.
  const [version, setVersion] = useState(0)
  // The tanks list is only for the plate number: the API lists them by creation, which is the order of the plates.
  const loaded = useLoad(async () => {
    const tank = await api.tank(id)
    // A visitor has no list of tanks, and the Demo Tank has no plate number to show them.
    const tanks = tank.readOnly ? [] : await api.tanks()
    // A tank whose photos cannot be read is shown with its drawing, as one with no photos.
    const photos = await api.photoSummary(tank.id).catch((): PhotoSummary => ({ count: 0, latestId: null }))
    return { tank, tanks, photos, today: new Date() }
  }, `${id}-${version}`)

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <>
        <Breadcrumbs items={[{ label: t('ui.nav.myTanks'), to: '/tanks' }]} />
        <LoadError error={loaded.error} />
      </>
    )
  }

  const { tank, tanks, photos, today } = loaded.data
  return (
    <>
      <header className="flex flex-col gap-4.5">
        <Breadcrumbs items={tank.readOnly ? [{ label: tank.name }] : [{ label: t('ui.nav.myTanks'), to: '/tanks' }, { label: tank.name }]} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-8">
          <TankPlate tank={tank} number={plateNumber(tanks, tank.id)} today={today} latestPhotoId={photos.latestId} />
          <RecordCard tank={tank} />
        </div>
      </header>
      <MeasurementSections tankId={tank.id} readOnly={tank.readOnly}>
        <PhotoStrip tank={tank} />
        <MaintenanceDiary tank={tank} />
        {!tank.readOnly && <TankLifecycle tank={tank} onChanged={() => setVersion((v) => v + 1)} />}
      </MeasurementSections>
    </>
  )
}

/** The tank's cover: its latest photo, or the drawing. Its corners say the plate number and how long it has been running. */
function TankPlate({
  tank,
  number,
  today,
  latestPhotoId,
}: {
  tank: Tank
  number: number | null
  today: Date
  latestPhotoId: string | null
}) {
  const { t } = useTranslation()
  const corners = [
    number !== null && `${t('ui.plate.plate')} ${roman(number)}`,
    t('tanks.page.weeks', { count: weeksRunning(tank.startDate, today) }),
  ].filter((corner) => corner !== false)
  return (
    <figure className={`${plateClasses('md')} m-0`}>
      <PlateCorners items={corners} />
      <div className="mt-1.5">
        <TankCover tank={tank} latestPhotoId={latestPhotoId} />
      </div>
    </figure>
  )
}

/** The tank's own facts, and the two things to do with it. A fact the keeper left out is not shown. */
function RecordCard({ tank }: { tank: Tank }) {
  const { t } = useTranslation()
  const language = useLanguage()
  // Nothing can be added to an Archived Tank, nor to one the reader does not own.
  const archived = tank.archivedAt !== null || tank.readOnly
  const missing = '—'
  const sizes = [tank.lengthCm, tank.widthCm, tank.heightCm]
  const size = (value: number | null) => (value === null ? missing : formatNumber(value, language))
  const facts: Array<[label: string, value: string]> = []
  if (tank.netVolumeLiters !== null) {
    facts.push([t('tanks.netVolume'), `${formatNumber(tank.netVolumeLiters, language)} L`])
  }
  if (sizes.some((value) => value !== null)) {
    facts.push([t('tanks.page.dimensions'), t('tanks.plate.size', { length: size(sizes[0]), width: size(sizes[1]), height: size(sizes[2]) })])
  }
  facts.push([t('tanks.form.startDate'), formatDay(tank.startDate, language)])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 text-[3.375rem] leading-none font-normal tracking-[-0.015em] [overflow-wrap:anywhere]">{tank.name}</h1>
      <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-4.5 gap-y-1.5 border-t border-ink/35 pt-3 text-base">
        {facts.map(([label, value]) => (
          <Fact key={label} label={label}>
            {value}
          </Fact>
        ))}
        {tank.note && (
          <Fact label={t('tanks.page.note')}>
            <Handwritten as="p" className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
              {tank.note}
            </Handwritten>
          </Fact>
        )}
      </dl>
      {tank.archivedAt && (
        <p role="status" className="m-0 border-l-[3px] border-ink pl-3 font-mono text-[0.8125rem] text-ink-soft">
          <strong className="font-medium uppercase">{t('tanks.lifecycle.archivedBadge')}</strong>{' '}
          {t('tanks.lifecycle.archivedOn', { date: formatDay(tank.archivedAt.slice(0, 10), language) })}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        {!archived && (
          <>
            <ButtonLink to={`/tanks/${tank.id}/measure`} icon="plus" aria-label={t('tanks.page.addMeasurement')}>
              {t('tanks.page.measurement')}
            </ButtonLink>
            <ButtonLink to={`/tanks/${tank.id}/maintenance/new`} variant="secondary" icon="plus" aria-label={t('maintenance.recordLabel')}>
              {t('maintenance.record')}
            </ButtonLink>
            <ButtonLink to={`/tanks/${tank.id}/photos/new`} variant="secondary" icon="plus" aria-label={t('photos.recordLabel')}>
              {t('photos.record')}
            </ButtonLink>
          </>
        )}
        {!tank.readOnly && (
          <ButtonLink to={`/tanks/${tank.id}/edit`} variant="secondary">
            {t('tanks.page.edit')}
          </ButtonLink>
        )}
      </div>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="pt-0.5 font-mono text-xs tracking-[0.1em] text-ink-muted uppercase">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  )
}

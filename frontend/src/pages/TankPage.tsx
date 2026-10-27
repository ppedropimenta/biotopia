import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { api } from '../auth/api'
import { Illustration } from '../components/ui/Brand'
import { ButtonLink } from '../components/ui/Button'
import { Handwritten } from '../components/ui/Paper'
import { PlateCorners } from '../components/ui/Plate'
import { plateClasses } from '../components/ui/plateClasses'
import { Breadcrumbs } from '../components/ui/Structure'
import { roman } from '../lib/roman'
import { formatDay, weeksRunning } from '../tanks/dates'
import { LoadError } from '../tanks/LoadError'
import { MeasurementSections } from '../tanks/MeasurementSections'
import { formatNumber } from '../tanks/numbers'
import { plateNumber } from '../tanks/plates'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** One tank as its page in the notebook: the drawn plate with the record card, then its water. */
export function TankPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  // The tanks list is only for the plate number: the API lists them by creation, which is the order of the plates.
  const loaded = useLoad(async () => {
    const [tank, tanks] = await Promise.all([api.tank(id), api.tanks()])
    return { tank, tanks, today: new Date() }
  }, id)

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <>
        <Breadcrumbs items={[{ label: t('ui.nav.myTanks'), to: '/tanks' }]} />
        <LoadError error={loaded.error} />
      </>
    )
  }

  const { tank, tanks, today } = loaded.data
  return (
    <>
      <header className="flex flex-col gap-4.5">
        <Breadcrumbs items={[{ label: t('ui.nav.myTanks'), to: '/tanks' }, { label: tank.name }]} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-8">
          <TankPlate tank={tank} number={plateNumber(tanks, tank.id)} today={today} />
          <RecordCard tank={tank} />
        </div>
      </header>
      <MeasurementSections tankId={tank.id} />
    </>
  )
}

/** The drawn tank. Its corners say the plate number and how long the tank has been running. */
function TankPlate({ tank, number, today }: { tank: Tank; number: number | null; today: Date }) {
  const { t } = useTranslation()
  const corners = [
    number !== null && `${t('ui.plate.plate')} ${roman(number)}`,
    t('tanks.page.weeks', { count: weeksRunning(tank.startDate, today) }),
  ].filter((corner) => corner !== false)
  return (
    <figure className={`${plateClasses('md')} m-0`}>
      <PlateCorners items={corners} />
      <Illustration slug="blackwater" decorative className="mt-1.5" />
    </figure>
  )
}

/** The tank's own facts, and the two things to do with it. A fact the keeper left out is not shown. */
function RecordCard({ tank }: { tank: Tank }) {
  const { t } = useTranslation()
  const language = useLanguage()
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
      <div className="flex flex-wrap gap-2.5">
        <ButtonLink to={`/tanks/${tank.id}/measure`} icon="plus" aria-label={t('tanks.page.addMeasurement')}>
          {t('tanks.page.measurement')}
        </ButtonLink>
        <ButtonLink to={`/tanks/${tank.id}/edit`} variant="secondary">
          {t('tanks.page.edit')}
        </ButtonLink>
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

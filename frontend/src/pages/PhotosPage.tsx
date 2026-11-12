import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { api } from '../auth/api'
import { ButtonLink } from '../components/ui/Button'
import { SectionHeader, PageHeader } from '../components/ui/Structure'
import { formatDay } from '../tanks/dates'
import { LoadError } from '../tanks/LoadError'
import { formatBytes, type Photo, type PhotoUsage } from '../tanks/photos'
import { PhotoCard } from '../tanks/PhotoCard'
import { PhotoViewer } from '../tanks/PhotoViewer'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

const localDay = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** The photos of one month, newest first. `from` is the index of the first one in the whole list. */
type Month = { key: string; label: string; photos: Photo[]; from: number }

function groupByMonth(photos: readonly Photo[], language: string): Month[] {
  const label = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' })
  const months: Month[] = []
  photos.forEach((photo, index) => {
    const taken = new Date(photo.takenAt)
    const key = `${taken.getFullYear()}-${taken.getMonth()}`
    const last = months[months.length - 1]
    if (last?.key === key) last.photos.push(photo)
    else months.push({ key, label: capitalized(label.format(taken)), photos: [photo], from: index })
  })
  return months
}

/** A tank's Tank Photos as polaroids in one grid, a month at a time, newest first, with how much storage is used. */
export function PhotosPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const { id = '' } = useParams()
  const [viewing, setViewing] = useState<number | null>(null)
  const loaded = useLoad(() => Promise.all([api.tank(id), api.photos(id)]).then(async ([tank, photos]) => [tank, photos, tank.readOnly ? null : await api.photoUsage()] as const), `photos-${id}`)

  const crumbs = [{ label: t('ui.nav.myTanks'), to: '/tanks' }]
  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <>
        <PageHeader breadcrumbs={crumbs} title={t('photos.title')} />
        <LoadError error={loaded.error} />
      </>
    )
  }

  const [tank, photos, usage] = loaded.data
  const subtitle =
    photos.length === 0
      ? undefined
      : t('photos.subtitle', {
          count: photos.length,
          from: formatDay(localDay(photos[photos.length - 1].takenAt), language),
          to: formatDay(localDay(photos[0].takenAt), language),
        })
  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: tank.name, to: `/tanks/${tank.id}` }, { label: t('photos.title') }]}
        title={t('photos.title')}
        subtitle={subtitle}
        actions={
          !tank.readOnly && (
            <ButtonLink to={`/tanks/${tank.id}/photos/new`} icon="plus" aria-label={t('photos.recordLabel')}>
              {t('photos.record')}
            </ButtonLink>
          )
        }
      />
      {photos.length === 0 ? (
        <div className="flex max-w-[60ch] flex-col gap-2 text-lead text-ink-soft">
          <p className="m-0">{t('photos.empty')}</p>
          {!tank.readOnly && (
            <Link to={`/tanks/${tank.id}/photos/new`} className="font-mono text-label text-ink">
              {t('photos.emptyCta')}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-9">
          {groupByMonth(photos, language).map((month) => (
            <section key={month.key} className="flex flex-col gap-5">
              <SectionHeader title={month.label} level={3} aside={t('photos.count', { count: month.photos.length })} />
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(200px,100%),240px))] items-start gap-x-7 gap-y-8 p-0">
                {month.photos.map((photo, i) => (
                  <li key={photo.id}>
                    <PhotoCard tank={tank} photo={photo} index={month.from + i} showDate onOpen={() => setViewing(month.from + i)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {usage && <Usage usage={usage} />}
      {viewing !== null && <PhotoViewer tank={tank} photos={photos} start={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}

/** How much of the quota is used: a bar and the same thing in words. */
function Usage({ usage }: { usage: PhotoUsage }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const share = Math.min(100, (usage.usedBytes / usage.quotaBytes) * 100)
  return (
    <div className="flex max-w-[420px] flex-col gap-1.5">
      <div
        role="meter"
        aria-label={t('photos.usageLabel')}
        aria-valuemin={0}
        aria-valuemax={usage.quotaBytes}
        aria-valuenow={usage.usedBytes}
        aria-valuetext={t('photos.usage', {
          used: formatBytes(usage.usedBytes, language),
          quota: formatBytes(usage.quotaBytes, language),
        })}
        className="h-2 border border-ink"
      >
        <div className="h-full bg-ink" style={{ width: `${share}%` }} />
      </div>
      <p className="m-0 font-mono text-xs text-ink-muted">
        {t('photos.usage', { used: formatBytes(usage.usedBytes, language), quota: formatBytes(usage.quotaBytes, language) })}
      </p>
    </div>
  )
}

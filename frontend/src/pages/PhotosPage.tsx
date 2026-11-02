import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { api } from '../auth/api'
import { ButtonLink } from '../components/ui/Button'
import { SectionHeader, PageHeader } from '../components/ui/Structure'
import { formatDay } from '../tanks/dates'
import { buildHistory } from '../tanks/history'
import { LoadError } from '../tanks/LoadError'
import { formatBytes, type PhotoUsage } from '../tanks/photos'
import { PhotoCard } from '../tanks/PhotoCard'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** A tank's Tank Photos as polaroids, a day at a time, newest day first, with how much of the storage is used. */
export function PhotosPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const { id = '' } = useParams()
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
  const days = buildHistory([], [], photos)
  const subtitle =
    days.length === 0
      ? undefined
      : t('photos.subtitle', {
          count: photos.length,
          from: formatDay(days[days.length - 1].day, language),
          to: formatDay(days[0].day, language),
        })
  let index = 0
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
      {usage && <Usage usage={usage} />}
      {photos.length === 0 ? (
        <div className="flex max-w-[46ch] flex-col gap-2 text-lead text-ink-soft">
          <p className="m-0">{t('photos.empty')}</p>
          {!tank.readOnly && (
            <Link to={`/tanks/${tank.id}/photos/new`} className="font-mono text-label text-ink">
              {t('photos.emptyCta')}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {days.map((day) => (
            <section key={day.day} className="flex flex-col gap-4">
              <SectionHeader title={formatDay(day.day, language)} level={3} />
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] items-start gap-6 p-0">
                {day.entries.map((entry) =>
                  entry.kind === 'photo' ? (
                    <li key={entry.photo.id}>
                      <PhotoCard tank={tank} photo={entry.photo} index={index++} />
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
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

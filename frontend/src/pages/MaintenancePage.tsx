import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { api } from '../auth/api'
import { ButtonLink } from '../components/ui/Button'
import { PageHeader } from '../components/ui/Structure'
import { LoadError } from '../tanks/LoadError'
import { MaintenanceEntry } from '../tanks/MaintenanceEntry'
import { useLoad } from '../tanks/useLoad'

/** A tank's Maintenance, newest first, each with a way to edit it. */
export function MaintenancePage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const loaded = useLoad(
    () => Promise.all([api.tank(id), api.maintenance(id)]),
    `maintenance-${id}`,
  )

  const crumbs = [{ label: t('ui.nav.myTanks'), to: '/tanks' }]
  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <>
        <PageHeader breadcrumbs={crumbs} title={t('maintenance.title')} />
        <LoadError error={loaded.error} />
      </>
    )
  }

  const [tank, entries] = loaded.data
  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: tank.name, to: `/tanks/${tank.id}` }, { label: t('maintenance.title') }]}
        title={t('maintenance.title')}
        subtitle={t('maintenance.lead')}
        actions={
          !tank.readOnly && (
            <ButtonLink to={`/tanks/${tank.id}/maintenance/new`} icon="plus">
              {t('maintenance.record')}
            </ButtonLink>
          )
        }
      />
      {entries.length === 0 ? (
        <div className="flex max-w-[46ch] flex-col gap-2 text-lead text-ink-soft">
          <p className="m-0">{t('maintenance.list.empty')}</p>
          {!tank.readOnly && (
            <Link to={`/tanks/${tank.id}/maintenance/new`} className="font-mono text-label text-ink">
              {t('maintenance.list.emptyCta')}
            </Link>
          )}
        </div>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {entries.map((entry, i) => (
            <MaintenanceEntry
              key={entry.id}
              entry={entry}
              index={i}
              netVolumeLiters={tank.netVolumeLiters}
              editTo={tank.readOnly ? undefined : `/tanks/${tank.id}/maintenance/${entry.id}/edit`}
            />
          ))}
        </ol>
      )}
    </>
  )
}

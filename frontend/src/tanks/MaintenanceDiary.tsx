import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../auth/api'
import { SectionHeader } from '../components/ui/Structure'
import { MaintenanceEntry } from './MaintenanceEntry'
import type { Tank } from './types'
import { useLoad } from './useLoad'

/** How many of the newest entries the tank page shows; the log has the rest. */
const diaryCount = 3

/** The newest Maintenance of a tank, with a link to all of it. Left out when there is none or it cannot be read. */
export function MaintenanceDiary({ tank }: { tank: Tank }) {
  const { t } = useTranslation()
  const loaded = useLoad(() => api.maintenance(tank.id, { limit: diaryCount }), `diary-${tank.id}`)

  if (loaded.status !== 'ready' || loaded.data.length === 0) return null
  return (
    <section className="flex flex-col gap-1">
      <SectionHeader
        title={t('maintenance.diary.title')}
        aside={<Link to={`/tanks/${tank.id}/maintenance`}>{t('maintenance.diary.seeAll')}</Link>}
      />
      <ol className="m-0 flex list-none flex-col p-0">
        {loaded.data.map((entry, i) => (
          <MaintenanceEntry key={entry.id} entry={entry} index={i} netVolumeLiters={tank.netVolumeLiters} size="md" />
        ))}
      </ol>
    </section>
  )
}

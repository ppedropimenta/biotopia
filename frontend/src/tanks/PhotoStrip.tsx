import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { api } from '../auth/api'
import { SectionHeader } from '../components/ui/Structure'
import { PhotoCard } from './PhotoCard'
import type { Tank } from './types'
import { useLoad } from './useLoad'

/** How many of the newest photos the tank page shows; the photos page has the rest. */
const stripCount = 3

/** The newest Tank Photos of a tank, with a link to all of them. Left out when there is none or it cannot be read. */
export function PhotoStrip({ tank }: { tank: Tank }) {
  const { t } = useTranslation()
  const loaded = useLoad(() => api.photos(tank.id, { limit: stripCount }), `photo-strip-${tank.id}`)

  if (loaded.status !== 'ready' || loaded.data.length === 0) return null
  return (
    <section className="flex flex-col gap-3.5">
      <SectionHeader
        title={t('photos.recent.title')}
        aside={<Link to={`/tanks/${tank.id}/photos`}>{t('photos.recent.seeAll')}</Link>}
      />
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] items-start gap-6 p-0">
        {loaded.data.map((photo, i) => (
          <li key={photo.id}>
            <PhotoCard tank={tank} photo={photo} index={i} />
          </li>
        ))}
      </ul>
    </section>
  )
}

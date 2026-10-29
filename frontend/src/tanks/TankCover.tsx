import { useTranslation } from 'react-i18next'
import { Illustration } from '../components/ui/Brand'
import { photoUrl } from './photos'
import type { Tank } from './types'

/**
 * What stands for a tank on its plate: its latest Tank Photo, and the drawing only while it has none. The tanks
 * list and the tank page both use it, so they always show the same one.
 */
export function TankCover({ tank, latestPhotoId }: { tank: Tank; latestPhotoId: string | null }) {
  const { t } = useTranslation()
  if (latestPhotoId === null) return <Illustration slug="blackwater" decorative />
  return (
    <img
      src={photoUrl(tank.id, latestPhotoId)}
      alt={t('photos.latestAlt', { name: tank.name })}
      loading="lazy"
      className="block aspect-[4/3] w-full object-cover"
    />
  )
}

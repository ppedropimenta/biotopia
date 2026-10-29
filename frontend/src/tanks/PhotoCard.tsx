import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Polaroid } from '../components/ui/Paper'
import { formatMoment } from './measurements'
import { photoUrl, type Photo } from './photos'
import { useLanguage } from './useLanguage'

/** Each polaroid is a little turned, never the same as its neighbour. */
const turns = [-2, 1.5, -1, 2, -1.5]

/** The shape of the frame follows the picture, but never gets taller than 3:4 or wider than 16:10. */
const frameAspect = (photo: Photo) => Math.min(1.6, Math.max(0.75, photo.width / photo.height))

/** One Tank Photo as a polaroid with its note under it. It links to where the date and note are edited, unless the tank is read-only. */
export function PhotoCard({
  tank,
  photo,
  index,
}: {
  tank: { id: string; name: string; readOnly?: boolean }
  photo: Photo
  index: number
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const when = formatMoment(photo.takenAt, language)
  if (tank.readOnly) {
    return (
      <Polaroid
        src={photoUrl(tank.id, photo.id)}
        alt={t('photos.alt', { name: tank.name, date: when })}
        aspect={String(frameAspect(photo))}
        rotate={turns[index % turns.length]}
        caption={photo.note ?? undefined}
        imgClassName="size-full object-cover"
      />
    )
  }
  return (
    <Link
      to={`/tanks/${tank.id}/photos/${photo.id}/edit`}
      aria-label={t('photos.editLabel', { date: when })}
      className="block no-underline hover:text-ink"
    >
      <Polaroid
        src={photoUrl(tank.id, photo.id)}
        alt={t('photos.alt', { name: tank.name, date: when })}
        aspect={String(frameAspect(photo))}
        rotate={turns[index % turns.length]}
        caption={photo.note ?? undefined}
        imgClassName="size-full object-cover"
      />
    </Link>
  )
}

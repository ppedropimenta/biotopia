import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink } from '../components/ui/Button'
import { Handwritten } from '../components/ui/Paper'
import { formatMoment } from './measurements'
import { photoUrl, type Photo } from './photos'
import { useLanguage } from './useLanguage'

/**
 * Tank Photos at a larger size, in a modal dialog: Escape, the backdrop or the button close it, and the arrow keys
 * walk through the photos when there are several (the ones of one day on the chart). Unless the tank is read-only,
 * a link goes to where the date and note are edited.
 */
export function PhotoViewer({
  tank,
  photos,
  start = 0,
  onClose,
}: {
  tank: { id: string; name: string; readOnly?: boolean }
  photos: readonly Photo[]
  /** The index of the photo to show first. */
  start?: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(start)
  const photo = photos[index]
  const when = formatMoment(photo.takenAt, language)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const step = (by: number) => setIndex((i) => Math.max(0, Math.min(photos.length - 1, i + by)))
  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'ArrowRight') step(1)
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      aria-label={t('photos.alt', { name: tank.name, date: when })}
      className="m-auto max-h-[96vh] max-w-[min(96vw,1000px)] overflow-visible bg-transparent p-3 backdrop:bg-water-black/85"
    >
      <figure className="m-0 flex flex-col gap-3 bg-paper-photo p-3 text-ink shadow-photo">
        <img
          src={photoUrl(tank.id, photo.id)}
          alt={t('photos.alt', { name: tank.name, date: when })}
          className="mx-auto block max-h-[68vh] w-auto max-w-full object-contain"
        />
        <figcaption className="flex flex-col gap-1">
          <span className="font-mono text-label tracking-[0.08em] text-ink-muted uppercase">{when}</span>
          {photo.note && (
            <Handwritten as="p" size="sm" className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
              {photo.note}
            </Handwritten>
          )}
        </figcaption>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {photos.length > 1 ? (
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => step(-1)} disabled={index === 0} aria-label={t('photos.viewer.previous')}>
                ←
              </Button>
              <span className="font-mono text-caption text-ink-muted">{t('photos.viewer.position', { index: index + 1, count: photos.length })}</span>
              <Button variant="secondary" onClick={() => step(1)} disabled={index === photos.length - 1} aria-label={t('photos.viewer.next')}>
                →
              </Button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-3">
            {!tank.readOnly && (
              <ButtonLink variant="secondary" to={`/tanks/${tank.id}/photos/${photo.id}/edit`}>
                {t('photos.viewer.edit')}
              </ButtonLink>
            )}
            <Button onClick={() => dialog.current?.close()}>{t('photos.viewer.close')}</Button>
          </div>
        </div>
      </figure>
    </dialog>
  )
}

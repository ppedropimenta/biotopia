import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { NoteField, TextField } from '../components/ui/Field'
import { LoadError } from '../tanks/LoadError'
import { MeasurementHeader } from '../tanks/MeasurementHeader'
import { cleanNote, readMoment, toLocalInput } from '../tanks/measurements'
import {
  acceptedTypes,
  checkFile,
  describePhotoError,
  formatBytes,
  photoUrl,
  type ErrorKey,
  type FormErrors,
  type Photo,
  type PhotoUsage,
} from '../tanks/photos'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** Adds a Tank Photo (`mode` "new") or changes the date and note of one, or deletes it ("edit"). */
export function PhotoFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const { id = '', photoId = '' } = useParams()
  const loaded = useLoad(
    () => Promise.all([api.tank(id), mode === 'edit' ? api.photo(id, photoId) : null, api.photoUsage()]),
    `photo-form-${id}-${photoId}`,
  )

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') return <LoadError error={loaded.error} />
  const [tank, photo, usage] = loaded.data
  return <FormScreen tank={tank} photo={photo} usage={usage} />
}

function FormScreen({ tank, photo, usage }: { tank: Tank; photo: Photo | null; usage: PhotoUsage }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const list = `/tanks/${tank.id}/photos`
  const [file, setFile] = useState<File | null>(null)
  // "Now" is only prefilled for the person to see; a new photo sends no date unless they change it.
  const [moment, setMoment] = useState(() => toLocalInput(photo?.takenAt ?? new Date().toISOString()))
  const [momentChanged, setMomentChanged] = useState(false)
  const [note, setNote] = useState(photo?.note ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const message = (key: ErrorKey | undefined) => key && t(key)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found: FormErrors = {}
    const takenAt = momentChanged || photo ? readMoment(moment) : null
    if (!photo) {
      const problem = checkFile(file, usage.maxFileBytes)
      if (problem) found.file = problem
    }
    if (momentChanged && takenAt === null) found.moment = 'photos.errors.moment_invalid'
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setBusy(true)
    setErrors({})
    try {
      if (photo) {
        // A photo's date is only sent as typed when it was changed; otherwise it keeps its own.
        await api.editPhoto(tank.id, photo.id, { takenAt: momentChanged ? takenAt! : photo.takenAt, note: cleanNote(note) })
      } else {
        await api.uploadPhoto(tank.id, file!, takenAt, cleanNote(note))
      }
      navigate(list)
    } catch (error) {
      setErrors(describePhotoError(error))
      setBusy(false)
    }
  }

  async function remove() {
    if (!photo) return
    setBusy(true)
    try {
      await api.deletePhoto(tank.id, photo.id)
      navigate(list)
    } catch (error) {
      setErrors(describePhotoError(error))
      setConfirming(false)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <MeasurementHeader
        tank={tank}
        title={t(photo ? 'photos.form.editTitle' : 'photos.form.newTitle')}
        back={{ to: list, label: t('photos.form.back') }}
      />
      <form onSubmit={submit} noValidate aria-busy={busy} className="flex flex-col gap-5 pt-5">
        {photo ? (
          <img
            src={photoUrl(tank.id, photo.id)}
            alt={t('photos.alt', { name: tank.name, date: toLocalInput(photo.takenAt).replace('T', ' ') })}
            className="block max-h-80 w-full bg-paper-card object-contain"
          />
        ) : (
          <>
            <p className="m-0 text-ink-soft">{t('photos.form.lead', { max: formatBytes(usage.maxFileBytes, language) })}</p>
            <FileField
              label={t('photos.form.file')}
              error={message(errors.file)}
              onChange={(chosen) => setFile(chosen)}
            />
          </>
        )}

        <TextField
          name="moment"
          type="datetime-local"
          label={t('photos.form.moment')}
          hint={!photo && t('photos.form.momentHint')}
          error={message(errors.moment)}
          value={moment}
          onChange={(event) => {
            setMoment(event.target.value)
            setMomentChanged(true)
          }}
        />
        <NoteField
          name="note"
          label={t('photos.form.note')}
          error={message(errors.note)}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {errors.general && <FormError>{message(errors.general)}</FormError>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" icon="check" disabled={busy} className="flex-1">
            {busy ? t('photos.form.saving') : t(photo ? 'photos.edit.save' : 'photos.form.save')}
          </Button>
          <ButtonLink to={list} variant="secondary" size="lg">
            {t('photos.form.cancel')}
          </ButtonLink>
        </div>

        {photo && (
          <div className="border-t border-dashed border-ink/45 pt-4 pb-4">
            {confirming ? (
              <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t('photos.edit.confirmDelete')}>
                <span className="text-lead">{t('photos.edit.confirmDelete')}</span>
                <Button type="button" variant="secondary" disabled={busy} onClick={remove}>
                  {t('photos.edit.confirmYes')}
                </Button>
                <Button type="button" variant="dashed" onClick={() => setConfirming(false)}>
                  {t('photos.edit.confirmNo')}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="dashed" onClick={() => setConfirming(true)}>
                {t('photos.edit.delete')}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

/** The file chooser, labelled like the other fields; an error replaces nothing, it is added with a mark and words. */
function FileField({ label, error, onChange }: { label: string; error?: string; onChange: (file: File | null) => void }) {
  const id = 'photo-file'
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-mono text-caption tracking-[0.12em] text-ink-muted uppercase">
        {label}
      </label>
      <input
        id={id}
        name="file"
        type="file"
        accept={acceptedTypes.join(',')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="min-h-11 w-full border border-dashed border-ink/55 bg-transparent p-2 font-mono text-sm text-ink file:mr-3 file:cursor-pointer file:border file:border-ink file:bg-paper-card file:px-3 file:py-1.5 file:font-mono file:text-sm file:text-ink"
      />
      {error && (
        <span id={`${id}-error`} className="font-mono text-xs text-cardinal">
          <span aria-hidden="true">× </span>
          {error}
        </span>
      )}
    </div>
  )
}

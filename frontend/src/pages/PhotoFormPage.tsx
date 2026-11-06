import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { NoteField, TextField } from '../components/ui/Field'
import { Polaroid } from '../components/ui/Paper'
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
          <FileField
            label={t('photos.form.file')}
            file={file}
            hint={t('photos.form.fileHint', { max: formatBytes(usage.maxFileBytes, language) })}
            error={message(errors.file)}
            onChange={(chosen) => setFile(chosen)}
          />
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

/**
 * The file chooser, labelled like the other fields. The real input lies, invisible, over a box in the style of the
 * app, so the label, the keyboard and the file dialog all work as they do natively. Once a file is picked, its
 * picture is shown as a polaroid. An error is added with a mark and words.
 */
function FileField({
  label,
  file,
  hint,
  error,
  onChange,
}: {
  label: string
  file: File | null
  hint: string
  error?: string
  onChange: (file: File | null) => void
}) {
  const { t } = useTranslation()
  const id = 'photo-file'
  const [preview, setPreview] = useState<string | null>(null)
  const current = useRef<string | null>(null)

  // The picture is read from the file in the browser. Its address is let go when another file is picked or the form closes.
  const pick = (chosen: File | null) => {
    if (current.current) URL.revokeObjectURL(current.current)
    current.current = chosen && chosen.type.startsWith('image/') ? URL.createObjectURL(chosen) : null
    setPreview(current.current)
    onChange(chosen)
  }
  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current)
    },
    [],
  )

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-caption tracking-[0.12em] text-ink-muted uppercase">
        {label}
      </label>
      {preview && (
        <div className="w-full max-w-[280px] px-1.5 pt-1">
          <Polaroid src={preview} alt={t('photos.form.preview')} rotate={-1.5} aspect="4 / 3" caption={file?.name} imgClassName="size-full object-cover" />
        </div>
      )}
      <div className="relative has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
        <span
          aria-hidden="true"
          className="flex min-h-11 items-center gap-2 border border-dashed border-ink/55 px-3 font-mono text-label text-ink"
        >
          <Icon name="camera" size={16} strokeWidth={1.8} />
          {file ? t('photos.form.change') : t('photos.form.choose')}
        </span>
        <input
          id={id}
          name="file"
          type="file"
          accept={acceptedTypes.join(',')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          onChange={(event) => pick(event.target.files?.[0] ?? null)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>
      {error ? (
        <span id={`${id}-error`} className="font-mono text-xs text-cardinal">
          <span aria-hidden="true">× </span>
          {error}
        </span>
      ) : (
        <span id={`${id}-hint`} className="font-mono text-xs text-ink-muted">
          {hint}
        </span>
      )}
    </div>
  )
}

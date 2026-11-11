import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { NoteField, TextField } from '../components/ui/Field'
import { MeasurementGrid } from '../tanks/MeasurementGrid'
import { LoadError } from '../tanks/LoadError'
import { MeasurementHeader } from '../tanks/MeasurementHeader'
import {
  describeMeasurementError,
  toLocalInput,
  toNewMeasurements,
  type FormErrors,
  type Measurement,
  type Parameter,
  type RecordForm,
} from '../tanks/measurements'
import type { Tank } from '../tanks/types'
import { useLoad } from '../tanks/useLoad'
import { useMeasurementMessage } from '../tanks/useMeasurementMessage'

/** Records several Measurements at one moment: every Parameter has a field, and only the filled ones are sent. */
export function MeasurementFormPage() {
  const { id = '' } = useParams()
  const loaded = useLoad(() => Promise.all([api.tank(id), api.parameters(), api.latestMeasurements(id)]), `measure-${id}`)

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') return <LoadError error={loaded.error} />
  const [tank, parameters, latest] = loaded.data
  return <RecordScreen tank={tank} parameters={parameters} latest={latest} />
}

function RecordScreen({ tank, parameters, latest }: { tank: Tank; parameters: Parameter[]; latest: Measurement[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const message = useMeasurementMessage()
  // "Now" is only prefilled for the person to see; it is not sent unless they change it.
  const [form, setForm] = useState<RecordForm>(() => ({
    values: {},
    moment: toLocalInput(new Date().toISOString()),
    momentChanged: false,
    note: '',
  }))
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  const setValue = (parameter: Parameter, text: string) => {
    setForm({ ...form, values: { ...form.values, [parameter.code]: text } })
    // A value that is being fixed no longer has its mistake; the others keep theirs until the next save.
    setErrors(({ [parameter.code]: _fixed, ...rest }) => rest)
  }
  const filled = Object.values(form.values).filter((text) => text.trim() !== '').length

  async function submit(event: FormEvent) {
    event.preventDefault()
    const checked = toNewMeasurements(form, parameters)
    if ('errors' in checked) {
      setErrors(checked.errors)
      return
    }
    setSaving(true)
    setErrors({})
    try {
      await api.recordMeasurements(tank.id, checked.request)
      navigate(`/tanks/${tank.id}`)
    } catch (error) {
      setErrors(describeMeasurementError(error))
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full">
      <MeasurementHeader tank={tank} title={t('measurements.form.title')} />
      <form onSubmit={submit} noValidate aria-busy={saving} className="flex flex-col gap-5 pt-5 pb-4">
        <p className="m-0 text-ink-soft">{t('measurements.form.lead')}</p>

        <MeasurementGrid parameters={parameters} latest={latest} values={form.values} errors={errors} onChange={setValue} />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="moment"
            type="datetime-local"
            label={t('measurements.form.moment')}
            hint={t('measurements.form.momentHint')}
            error={message(errors.moment)}
            value={form.moment}
            onChange={(event) => setForm({ ...form, moment: event.target.value, momentChanged: true })}
          />
          <NoteField
            name="note"
            label={t('measurements.form.note')}
            error={message(errors.note)}
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
          />
        </div>

        {errors.general && <FormError>{message(errors.general)}</FormError>}
        <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-ink/40 texture-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-lead">
            {filled === 0 ? t('measurements.form.noneYet') : t('measurements.form.count', { count: filled })}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink to={`/tanks/${tank.id}`} variant="secondary" size="lg">
              {t('measurements.form.cancel')}
            </ButtonLink>
            <Button
              type="submit"
              size="lg"
              icon="check"
              disabled={saving}
              className="flex-1 whitespace-nowrap max-sm:[&>svg]:hidden sm:flex-none"
            >
              {saving ? t('measurements.form.saving') : t('measurements.form.save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

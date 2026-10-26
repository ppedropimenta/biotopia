import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { fieldButton, fieldLink } from '../auth/classes'
import { Field, TextAreaField } from '../auth/Field'
import { LoadError } from '../tanks/LoadError'
import {
  describeMeasurementError,
  toLocalInput,
  toNewMeasurements,
  type FormErrors,
  type Parameter,
  type RecordForm,
} from '../tanks/measurements'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'
import { useMeasurementMessage } from '../tanks/useMeasurementMessage'

/** Records several Measurements at one moment: every Parameter has a field, and only the filled ones are sent. */
export function MeasurementFormPage() {
  const { id = '' } = useParams()
  const loaded = useLoad(() => Promise.all([api.tank(id), api.parameters()]), `measure-${id}`)

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <div className="px-5 pt-10 pb-24 sm:px-8 lg:pt-16">
        <LoadError error={loaded.error} />
      </div>
    )
  }
  return <RecordScreen tankId={id} tankName={loaded.data[0].name} parameters={loaded.data[1]} />
}

function RecordScreen({ tankId, tankName, parameters }: { tankId: string; tankName: string; parameters: Parameter[] }) {
  const { t } = useTranslation()
  const language = useLanguage()
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

  async function submit(event: FormEvent) {
    event.preventDefault()
    const checked = toNewMeasurements(form, parameters, language)
    if ('errors' in checked) {
      setErrors(checked.errors)
      return
    }
    setSaving(true)
    setErrors({})
    try {
      await api.recordMeasurements(tankId, checked.request)
      navigate(`/tanks/${tankId}`)
    } catch (error) {
      setErrors(describeMeasurementError(error))
      setSaving(false)
    }
  }

  return (
    <>
      <div className="px-5 pt-10 pb-14 sm:px-8 lg:pt-16">
        <Link to={`/tanks/${tankId}`} className="rise text-[15px] underline underline-offset-4 hover:text-muted">
          ← {tankName}
        </Link>
        <h1 className="rise mt-6 font-display text-[clamp(40px,6vw,88px)] leading-[0.95] tracking-[-0.02em]">
          {t('measurements.form.title')}
        </h1>
        <p className="rise mt-5 max-w-[52ch] text-[18px] leading-relaxed">{t('measurements.form.lead')}</p>
      </div>

      <section className="mb-16 bg-tannin px-5 py-14 text-on-tannin sm:px-8 lg:mb-24 lg:py-20">
        <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[2fr_1fr] lg:gap-x-20">
          <div className="lg:col-start-2 lg:row-start-1">
            <Field
              id="moment"
              name="moment"
              type="datetime-local"
              label={t('measurements.form.moment')}
              hint={t('measurements.form.momentHint')}
              value={form.moment}
              error={message(errors.moment)}
              onChange={(event) => setForm({ ...form, moment: event.target.value, momentChanged: true })}
            />
          </div>

          <fieldset className="lg:col-start-1 lg:row-span-3 lg:row-start-1">
            <legend className="font-display text-[30px] italic">{t('measurements.form.valuesTitle')}</legend>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {parameters.map((parameter) => (
                <Field
                  key={parameter.code}
                  id={parameter.code}
                  name={parameter.code}
                  inputMode="decimal"
                  autoComplete="off"
                  label={parameter.unit ? `${t(`parameters.${parameter.code}`)} (${parameter.unit})` : t(`parameters.${parameter.code}`)}
                  value={form.values[parameter.code] ?? ''}
                  error={message(errors[parameter.code], parameter)}
                  onChange={(event) =>
                    setForm({ ...form, values: { ...form.values, [parameter.code]: event.target.value } })
                  }
                />
              ))}
            </div>
          </fieldset>

          <div className="lg:col-start-2 lg:row-start-2">
            <TextAreaField
              id="note"
              name="note"
              label={t('measurements.form.note')}
              value={form.note}
              error={message(errors.note)}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </div>

          <div className="grid content-start gap-6 lg:col-start-2 lg:row-start-3">
            {errors.general && (
              <p role="alert" className="text-[15px] text-neon-red">
                {message(errors.general)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <button type="submit" disabled={saving} className={fieldButton}>
                {saving ? t('measurements.form.saving') : t('measurements.form.save')}
              </button>
              <Link to={`/tanks/${tankId}`} className={fieldLink}>
                {t('measurements.form.cancel')}
              </Link>
            </div>
          </div>
        </form>
      </section>
    </>
  )
}

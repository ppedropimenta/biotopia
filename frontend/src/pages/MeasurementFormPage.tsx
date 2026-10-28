import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { NoteField, TextField } from '../components/ui/Field'
import { LoadError } from '../tanks/LoadError'
import { MeasurementHeader } from '../tanks/MeasurementHeader'
import {
  describeMeasurementError,
  toLocalInput,
  toNewMeasurements,
  valueDecimals,
  type FormErrors,
  type Measurement,
  type Parameter,
  type RecordForm,
} from '../tanks/measurements'
import { formatNumber } from '../tanks/numbers'
import { nudge, nudgeable } from '../tanks/nudge'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'
import { useMeasurementMessage } from '../tanks/useMeasurementMessage'

/** Records several Measurements at one moment: every Parameter has a field, and only the filled ones are sent. */
export function MeasurementFormPage() {
  const { id = '' } = useParams()
  const loaded = useLoad(
    () => Promise.all([api.tank(id), api.parameters(), api.latestMeasurements(id)]),
    `measure-${id}`,
  )

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') return <LoadError error={loaded.error} />
  const [tank, parameters, latest] = loaded.data
  return <RecordScreen tank={tank} parameters={parameters} latest={latest} />
}

function RecordScreen({ tank, parameters, latest }: { tank: Tank; parameters: Parameter[]; latest: Measurement[] }) {
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

  const lastOf = (parameter: Parameter) => latest.find((m) => m.parameter === parameter.code)?.value ?? null
  const setValue = (parameter: Parameter, text: string) =>
    setForm({ ...form, values: { ...form.values, [parameter.code]: text } })

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
      await api.recordMeasurements(tank.id, checked.request)
      navigate(`/tanks/${tank.id}`)
    } catch (error) {
      setErrors(describeMeasurementError(error))
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <MeasurementHeader tank={tank} title={t('measurements.form.title')} />
      <form onSubmit={submit} noValidate aria-busy={saving} className="flex flex-col gap-5 pt-5">
        <p className="m-0 text-ink-soft">{t('measurements.form.lead')}</p>

        {parameters.map((parameter) => {
          const last = lastOf(parameter)
          const name = t(`parameters.${parameter.code}`)
          return (
            <TextField
              key={parameter.code}
              name={parameter.code}
              inputMode="decimal"
              autoComplete="off"
              label={name}
              keepCase={parameter.code === 'ph' || parameter.code === 'iron'}
              unit={parameter.unit}
              hint={
                last !== null &&
                t('measurements.form.last', {
                  value: `${formatNumber(last, language, { maxDecimals: valueDecimals })} ${parameter.unit}`.trim(),
                })
              }
              error={message(errors[parameter.code], parameter)}
              value={form.values[parameter.code] ?? ''}
              onChange={(event) => setValue(parameter, event.target.value)}
              nudge={
                nudgeable(parameter.code)
                  ? {
                      onNudge: (direction) =>
                        setValue(parameter, nudge(form.values[parameter.code] ?? '', direction, parameter, last, language)),
                      decrementLabel: t('measurements.form.decrease', { name }),
                      incrementLabel: t('measurements.form.increase', { name }),
                    }
                  : undefined
              }
            />
          )
        })}

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

        {errors.general && <FormError>{message(errors.general)}</FormError>}
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <Button type="submit" size="lg" icon="check" disabled={saving} className="flex-1">
            {saving ? t('measurements.form.saving') : t('measurements.form.save')}
          </Button>
          <ButtonLink to={`/tanks/${tank.id}`} variant="secondary" size="lg">
            {t('measurements.form.cancel')}
          </ButtonLink>
        </div>
      </form>
    </div>
  )
}

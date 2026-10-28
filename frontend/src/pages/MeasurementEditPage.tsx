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
  toChange,
  toLocalInput,
  valueDecimals,
  type EditForm,
  type FormErrors,
  type Measurement,
  type Parameter,
} from '../tanks/measurements'
import { formatNumber } from '../tanks/numbers'
import { nudge, nudgeable } from '../tanks/nudge'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'
import { useMeasurementMessage } from '../tanks/useMeasurementMessage'

/** Fixes or removes one Measurement. Its Parameter stays: a value in the wrong Parameter is deleted and recorded again. */
export function MeasurementEditPage() {
  const { id = '', measurementId = '' } = useParams()
  const loaded = useLoad(
    () => Promise.all([api.measurement(id, measurementId), api.parameters(), api.tank(id)]),
    `measurement-${id}-${measurementId}`,
  )

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') return <LoadError error={loaded.error} />
  const [measurement, parameters, tank] = loaded.data
  const parameter = parameters.find((p) => p.code === measurement.parameter)
  if (!parameter) return null
  return <EditScreen tank={tank} measurement={measurement} parameter={parameter} />
}

function EditScreen({ tank, measurement, parameter }: { tank: Tank; measurement: Measurement; parameter: Parameter }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const message = useMeasurementMessage()
  const [form, setForm] = useState<EditForm>(() => ({
    value: formatNumber(measurement.value, language, { grouping: false, maxDecimals: valueDecimals }),
    moment: toLocalInput(measurement.measuredAt),
    note: measurement.note ?? '',
  }))
  const [errors, setErrors] = useState<FormErrors>({})
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const name = t(`parameters.${parameter.code}`)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const checked = toChange(form, parameter, language)
    if ('errors' in checked) {
      setErrors(checked.errors)
      return
    }
    setBusy(true)
    setErrors({})
    // The field shows minutes only; left alone, the moment keeps its exact instant.
    const momentUntouched = form.moment === toLocalInput(measurement.measuredAt)
    const change = momentUntouched ? { ...checked.change, measuredAt: measurement.measuredAt } : checked.change
    try {
      await api.editMeasurement(tank.id, measurement.id, change)
      navigate(`/tanks/${tank.id}`)
    } catch (error) {
      setErrors(describeMeasurementError(error))
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await api.deleteMeasurement(tank.id, measurement.id)
      navigate(`/tanks/${tank.id}`)
    } catch (error) {
      setErrors(describeMeasurementError(error))
      setConfirming(false)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <MeasurementHeader tank={tank} title={t('measurements.edit.title')} />
      <form onSubmit={submit} noValidate aria-busy={busy} className="flex flex-col gap-5 pt-5">
        <p className="m-0 text-lead">{name}</p>
        <TextField
          name="value"
          inputMode="decimal"
          autoComplete="off"
          label={t('measurements.edit.value')}
          unit={parameter.unit}
          error={message(errors.value, parameter)}
          value={form.value}
          onChange={(event) => setForm({ ...form, value: event.target.value })}
          nudge={
            nudgeable(parameter.code)
              ? {
                  onNudge: (direction) =>
                    setForm({ ...form, value: nudge(form.value, direction, parameter, measurement.value, language) }),
                  decrementLabel: t('measurements.form.decrease', { name }),
                  incrementLabel: t('measurements.form.increase', { name }),
                }
              : undefined
          }
        />
        <TextField
          name="moment"
          type="datetime-local"
          label={t('measurements.form.moment')}
          error={message(errors.moment)}
          value={form.moment}
          onChange={(event) => setForm({ ...form, moment: event.target.value })}
        />
        <NoteField
          name="note"
          label={t('measurements.form.note')}
          error={message(errors.note)}
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
        />

        {errors.general && <FormError>{message(errors.general)}</FormError>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" icon="check" disabled={busy} className="flex-1">
            {busy ? t('measurements.form.saving') : t('measurements.edit.save')}
          </Button>
          <ButtonLink to={`/tanks/${tank.id}`} variant="secondary" size="lg">
            {t('measurements.form.cancel')}
          </ButtonLink>
        </div>

        <div className="border-t border-dashed border-ink/45 pt-4 pb-4">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t('measurements.edit.confirmDelete')}>
              <span className="text-lead">{t('measurements.edit.confirmDelete')}</span>
              <Button type="button" variant="secondary" disabled={busy} onClick={remove}>
                {t('measurements.edit.confirmYes')}
              </Button>
              <Button type="button" variant="dashed" onClick={() => setConfirming(false)}>
                {t('measurements.edit.confirmNo')}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="dashed" onClick={() => setConfirming(true)}>
              {t('measurements.edit.delete')}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

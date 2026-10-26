import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { fieldButton, fieldLink } from '../auth/classes'
import { Field, TextAreaField } from '../auth/Field'
import { LoadError } from '../tanks/LoadError'
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
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'
import { useMeasurementMessage } from '../tanks/useMeasurementMessage'

/** Fixes or removes one Measurement. Its Parameter stays: a value in the wrong Parameter is deleted and recorded again. */
export function MeasurementEditPage() {
  const { id = '', measurementId = '' } = useParams()
  const loaded = useLoad(
    () => Promise.all([api.measurement(id, measurementId), api.parameters()]),
    `measurement-${id}-${measurementId}`,
  )

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') {
    return (
      <div className="px-5 pt-10 pb-24 sm:px-8 lg:pt-16">
        <LoadError error={loaded.error} />
      </div>
    )
  }
  const [measurement, parameters] = loaded.data
  const parameter = parameters.find((p) => p.code === measurement.parameter)
  if (!parameter) return null
  return <EditScreen tankId={id} measurement={measurement} parameter={parameter} />
}

function EditScreen({ tankId, measurement, parameter }: { tankId: string; measurement: Measurement; parameter: Parameter }) {
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
      await api.editMeasurement(tankId, measurement.id, change)
      navigate(`/tanks/${tankId}`)
    } catch (error) {
      setErrors(describeMeasurementError(error))
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await api.deleteMeasurement(tankId, measurement.id)
      navigate(`/tanks/${tankId}`)
    } catch (error) {
      setErrors(describeMeasurementError(error))
      setConfirming(false)
      setBusy(false)
    }
  }

  return (
    <>
      <div className="px-5 pt-10 pb-14 sm:px-8 lg:pt-16">
        <h1 className="rise font-display text-[clamp(40px,6vw,88px)] leading-[0.95] tracking-[-0.02em]">
          {t('measurements.edit.title')}
        </h1>
        <p className="rise mt-5 text-[18px]">{name}</p>
      </div>

      <section className="mb-16 bg-tannin px-5 py-14 text-on-tannin sm:px-8 lg:mb-24 lg:py-20">
        <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-2 lg:gap-x-20">
          <div className="grid content-start gap-6 sm:grid-cols-2">
            <Field
              id="value"
              name="value"
              inputMode="decimal"
              autoComplete="off"
              label={parameter.unit ? `${t('measurements.edit.value')} (${parameter.unit})` : t('measurements.edit.value')}
              value={form.value}
              error={message(errors.value, parameter)}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
            />
            <Field
              id="moment"
              name="moment"
              type="datetime-local"
              label={t('measurements.form.moment')}
              value={form.moment}
              error={message(errors.moment)}
              onChange={(event) => setForm({ ...form, moment: event.target.value })}
            />
          </div>

          <div className="grid content-start gap-12">
            <TextAreaField
              id="note"
              name="note"
              label={t('measurements.form.note')}
              value={form.note}
              error={message(errors.note)}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
            {errors.general && (
              <p role="alert" className="text-[15px] text-neon-red">
                {message(errors.general)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <button type="submit" disabled={busy} className={fieldButton}>
                {busy ? t('measurements.form.saving') : t('measurements.edit.save')}
              </button>
              <Link to={`/tanks/${tankId}`} className={fieldLink}>
                {t('measurements.form.cancel')}
              </Link>
            </div>
            <div>
              {confirming ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3" role="group" aria-label={t('measurements.edit.confirmDelete')}>
                  <span className="text-[18px]">{t('measurements.edit.confirmDelete')}</span>
                  <button type="button" disabled={busy} onClick={remove} className="cursor-pointer text-neon-red underline underline-offset-4">
                    {t('measurements.edit.confirmYes')}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className={`cursor-pointer ${fieldLink}`}>
                    {t('measurements.edit.confirmNo')}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirming(true)} className="cursor-pointer text-on-tannin-muted underline underline-offset-4 hover:text-neon-red">
                  {t('measurements.edit.delete')}
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </>
  )
}

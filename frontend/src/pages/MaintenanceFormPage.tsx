import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { ToggleChip } from '../components/ui/Chip'
import { NoteField, TextField } from '../components/ui/Field'
import { LoadError } from '../tanks/LoadError'
import {
  describeMaintenanceError,
  maintenanceTypes,
  toDetails,
  type ErrorKey,
  type FormErrors,
  type Maintenance,
  type MaintenanceForm,
  type MaintenanceType,
} from '../tanks/maintenance'
import { MeasurementHeader } from '../tanks/MeasurementHeader'
import { toLocalInput } from '../tanks/measurements'
import { formatNumber } from '../tanks/numbers'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'

/** Records a Maintenance (`mode` "new") or fixes or removes one that exists ("edit"). */
export function MaintenanceFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const { id = '', maintenanceId = '' } = useParams()
  const loaded = useLoad(
    () => Promise.all([api.tank(id), mode === 'edit' ? api.maintenanceEntry(id, maintenanceId) : null]),
    `maintenance-form-${id}-${maintenanceId}`,
  )

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') return <LoadError error={loaded.error} />
  const [tank, entry] = loaded.data
  return <FormScreen tank={tank} entry={entry} />
}

function FormScreen({ tank, entry }: { tank: Tank; entry: Maintenance | null }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const list = `/tanks/${tank.id}/maintenance`
  // "Now" is only prefilled for the person to see; a new record sends no moment unless they change it.
  const [form, setForm] = useState<MaintenanceForm>(() => ({
    types: [entry?.type ?? 'water_change'],
    percent: entry?.percent == null ? '' : formatNumber(entry.percent, language, { grouping: false }),
    moment: toLocalInput(entry?.performedAt ?? new Date().toISOString()),
    momentChanged: false,
    note: entry?.note ?? '',
  }))
  const [errors, setErrors] = useState<FormErrors>({})
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const message = (key: ErrorKey | undefined) =>
    key && t(key, { example: formatNumber(12.5, language) })

  async function submit(event: FormEvent) {
    event.preventDefault()
    const checked = toDetails(form, language, entry?.performedAt ?? null)
    if ('errors' in checked) {
      setErrors(checked.errors)
      return
    }
    setBusy(true)
    setErrors({})
    try {
      if (entry) await api.editMaintenance(tank.id, entry.id, checked.details[0])
      else await api.recordMaintenance(tank.id, checked.details)
      navigate(list)
    } catch (error) {
      setErrors(describeMaintenanceError(error))
      setBusy(false)
    }
  }

  /** A new record can combine types; an edit changes the one type the record has. */
  function pick(type: MaintenanceType) {
    if (entry) return setForm({ ...form, types: [type] })
    const types = form.types.includes(type) ? form.types.filter((picked) => picked !== type) : [...form.types, type]
    setForm({ ...form, types })
  }

  async function remove() {
    if (!entry) return
    setBusy(true)
    try {
      await api.deleteMaintenance(tank.id, entry.id)
      navigate(list)
    } catch (error) {
      setErrors(describeMaintenanceError(error))
      setConfirming(false)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <MeasurementHeader
        tank={tank}
        title={t(entry ? 'maintenance.form.editTitle' : 'maintenance.form.newTitle')}
        back={{ to: list, label: t('maintenance.form.back') }}
      />
      <form onSubmit={submit} noValidate aria-busy={busy} className="flex flex-col gap-5 pt-5">
        <p className="m-0 text-ink-soft">{t('maintenance.form.lead')}</p>

        <div role="group" aria-label={t('maintenance.form.type')} className="flex flex-col gap-2">
          <span
            aria-hidden="true"
            className="font-mono text-[0.71875rem] tracking-[0.12em] text-ink-muted uppercase"
          >
            {t('maintenance.form.type')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {maintenanceTypes.map((type) => (
              <ToggleChip
                key={type}
                variant="accent"
                pressed={form.types.includes(type)}
                onClick={() => pick(type)}
              >
                {t(`maintenance.types.${type}`)}
              </ToggleChip>
            ))}
          </div>
          {errors.type ? (
            <FormError>{message(errors.type)}</FormError>
          ) : (
            !entry && <span className="font-mono text-xs text-ink-muted">{t('maintenance.form.typeHint')}</span>
          )}
        </div>

        {form.types.includes('water_change') && (
          <TextField
            name="percent"
            inputMode="decimal"
            autoComplete="off"
            label={t('maintenance.form.percent')}
            unit="%"
            hint={t('maintenance.form.percentHint')}
            error={message(errors.percent)}
            value={form.percent}
            onChange={(event) => setForm({ ...form, percent: event.target.value })}
          />
        )}

        <TextField
          name="moment"
          type="datetime-local"
          label={t('maintenance.form.moment')}
          hint={!entry && t('maintenance.form.momentHint')}
          error={message(errors.moment)}
          value={form.moment}
          onChange={(event) => setForm({ ...form, moment: event.target.value, momentChanged: true })}
        />
        <NoteField
          name="note"
          label={t(form.types.includes('other') ? 'maintenance.form.noteOther' : 'maintenance.form.note')}
          error={message(errors.note)}
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
        />

        {errors.general && <FormError>{message(errors.general)}</FormError>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" icon="check" disabled={busy} className="flex-1">
            {busy ? t('maintenance.form.saving') : t(entry ? 'maintenance.edit.save' : 'maintenance.form.save')}
          </Button>
          <ButtonLink to={list} variant="secondary" size="lg">
            {t('maintenance.form.cancel')}
          </ButtonLink>
        </div>

        {entry && (
          <div className="border-t border-dashed border-ink/45 pt-4 pb-4">
            {confirming ? (
              <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t('maintenance.edit.confirmDelete')}>
                <span className="text-lead">{t('maintenance.edit.confirmDelete')}</span>
                <Button type="button" variant="secondary" disabled={busy} onClick={remove}>
                  {t('maintenance.edit.confirmYes')}
                </Button>
                <Button type="button" variant="dashed" onClick={() => setConfirming(false)}>
                  {t('maintenance.edit.confirmNo')}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="dashed" onClick={() => setConfirming(true)}>
                {t('maintenance.edit.delete')}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

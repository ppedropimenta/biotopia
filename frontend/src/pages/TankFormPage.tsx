import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { NoteField, TextField } from '../components/ui/Field'
import { Plate } from '../components/ui/Plate'
import { PageHeader } from '../components/ui/Structure'
import { describeTankError, emptyForm, formFromTank, toDetails, type FormErrors, type TankForm } from '../tanks/form'
import { formatNumber } from '../tanks/numbers'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { LoadError } from '../tanks/LoadError'
import { useLoad } from '../tanks/useLoad'

/** Creating a tank (/tanks/new) and editing one (/tanks/:id/edit) share this form. */
export function TankFormPage() {
  const { id } = useParams()
  const tank = useLoad(() => (id ? api.tank(id) : Promise.resolve(null)), id ?? 'new')

  if (tank.status === 'loading') return null
  if (tank.status === 'error') return <LoadError error={tank.error} />
  return <TankFormScreen tank={tank.data} />
}

function TankFormScreen({ tank }: { tank: Tank | null }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState<TankForm>(() => (tank ? formFromTank(tank, language) : emptyForm))
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  const message = (key: FormErrors[keyof FormErrors]) => key && t(key, { example: formatNumber(80.5, language) })
  const bind = (field: keyof TankForm) => ({
    value: form[field],
    error: message(errors[field]),
    onChange: (event: { target: { value: string } }) => setForm({ ...form, [field]: event.target.value }),
  })

  async function submit(event: FormEvent) {
    event.preventDefault()
    const checked = toDetails(form, language)
    if ('errors' in checked) {
      setErrors(checked.errors)
      return
    }
    setSaving(true)
    setErrors({})
    try {
      const saved = tank ? await api.editTank(tank.id, checked.details) : await api.createTank(checked.details)
      navigate(`/tanks/${saved.id}`)
    } catch (error) {
      setErrors(describeTankError(error))
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={tank ? t('tanks.form.editTitle') : t('tanks.form.newTitle')}
        subtitle={t('tanks.enough')}
      />

      <Plate size="lg" as="div" className="w-full max-w-[720px]">
        <form onSubmit={submit} noValidate aria-busy={saving} className="flex flex-col gap-7">
          <div className="grid gap-5.5 sm:grid-cols-[2fr_1fr]">
            <TextField name="name" autoComplete="off" label={t('tanks.form.name')} {...bind('name')} />
            <TextField name="startDate" type="date" label={t('tanks.form.startDate')} {...bind('startDate')} />
          </div>

          <fieldset className="m-0 flex min-w-0 flex-col gap-5.5 border-0 p-0">
            <legend className="mb-2 p-0 text-h3">{t('tanks.form.sizeTitle')}</legend>
            <p className="m-0 text-ink-soft">{t('tanks.form.sizeLead')}</p>
            <div className="grid gap-5.5 sm:grid-cols-3">
              <TextField name="lengthCm" inputMode="decimal" autoComplete="off" label={t('tanks.form.length')} {...bind('lengthCm')} />
              <TextField name="widthCm" inputMode="decimal" autoComplete="off" label={t('tanks.form.width')} {...bind('widthCm')} />
              <TextField name="heightCm" inputMode="decimal" autoComplete="off" label={t('tanks.form.height')} {...bind('heightCm')} />
            </div>
            <TextField
              name="netVolumeLiters"
              inputMode="decimal"
              autoComplete="off"
              label={t('tanks.form.netVolume')}
              hint={t('tanks.form.netVolumeHint')}
              className="max-w-sm"
              {...bind('netVolumeLiters')}
            />
          </fieldset>

          <NoteField name="note" label={t('tanks.form.note')} {...bind('note')} />

          {errors.general && <FormError>{message(errors.general)}</FormError>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? t('tanks.form.saving') : t('tanks.form.save')}
            </Button>
            <ButtonLink to={tank ? `/tanks/${tank.id}` : '/tanks'} variant="secondary" size="lg">
              {t('tanks.form.cancel')}
            </ButtonLink>
          </div>
        </form>
      </Plate>
    </>
  )
}

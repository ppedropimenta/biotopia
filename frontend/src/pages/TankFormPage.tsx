import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { fieldButton, fieldLink } from '../auth/classes'
import { Field, TextAreaField } from '../auth/Field'
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
  if (tank.status === 'error') {
    return (
      <div className="px-5 pt-10 pb-24 sm:px-8 lg:pt-16">
        <LoadError error={tank.error} />
      </div>
    )
  }
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
      <div className="px-5 pt-10 pb-14 sm:px-8 lg:pt-16">
        <h1 className="rise font-display text-[clamp(40px,6vw,88px)] leading-[0.95] tracking-[-0.02em]">
          {tank ? t('tanks.form.editTitle') : t('tanks.form.newTitle')}
        </h1>
        {!tank && <p className="rise mt-5 max-w-[46ch] text-[18px] leading-relaxed">{t('tanks.form.newLead')}</p>}
      </div>

      <section className="mb-16 bg-tannin px-5 py-14 text-on-tannin sm:px-8 lg:mb-24 lg:py-20">
        <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-2 lg:gap-x-20">
          <div className="grid content-start gap-12">
            <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
              <Field id="name" name="name" autoComplete="off" label={t('tanks.form.name')} {...bind('name')} />
              <Field id="startDate" name="startDate" type="date" label={t('tanks.form.startDate')} {...bind('startDate')} />
            </div>

            <fieldset>
              <legend className="font-display text-[30px] italic">{t('tanks.form.sizeTitle')}</legend>
              <p className="mt-2 text-[18px]">{t('tanks.form.sizeLead')}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <Field id="lengthCm" name="lengthCm" inputMode="decimal" autoComplete="off" label={t('tanks.form.length')} {...bind('lengthCm')} />
                <Field id="widthCm" name="widthCm" inputMode="decimal" autoComplete="off" label={t('tanks.form.width')} {...bind('widthCm')} />
                <Field id="heightCm" name="heightCm" inputMode="decimal" autoComplete="off" label={t('tanks.form.height')} {...bind('heightCm')} />
              </div>
              <div className="mt-6 max-w-sm">
                <Field
                  id="netVolumeLiters"
                  name="netVolumeLiters"
                  inputMode="decimal"
                  autoComplete="off"
                  label={t('tanks.form.netVolume')}
                  hint={t('tanks.form.netVolumeHint')}
                  {...bind('netVolumeLiters')}
                />
              </div>
            </fieldset>
          </div>

          <div className="grid content-start gap-12">
            <TextAreaField id="note" name="note" label={t('tanks.form.note')} {...bind('note')} />

            {errors.general && (
              <p role="alert" className="text-[15px] text-neon-red">
                {message(errors.general)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <button type="submit" disabled={saving} className={fieldButton}>
                {saving ? t('tanks.form.saving') : t('tanks.form.save')}
              </button>
              <Link to={tank ? `/tanks/${tank.id}` : '/tanks'} className={fieldLink}>
                {t('tanks.form.cancel')}
              </Link>
            </div>
          </div>
        </form>
      </section>
    </>
  )
}

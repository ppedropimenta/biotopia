import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { ToggleChip } from '../components/ui/Chip'
import { NoteField, TextField } from '../components/ui/Field'
import { Handwritten } from '../components/ui/Paper'
import { Stamp } from '../components/ui/Stamp'
import { PageHeader } from '../components/ui/Structure'
import { cx } from '../lib/cx'
import { describeTankError, emptyForm, formFromTank, toDetails, type FormErrors, type TankForm } from '../tanks/form'
import { LoadError } from '../tanks/LoadError'
import { formatNumber, parseNumber } from '../tanks/numbers'
import { plateNumber } from '../tanks/plates'
import { commonSizes, dimensionStep, stepped, volumeStep } from '../tanks/sizes'
import { TankPlatePreview } from '../tanks/TankPlatePreview'
import type { Dimension } from '../tanks/TankSketch'
import type { Tank } from '../tanks/types'
import { useLanguage } from '../tanks/useLanguage'
import { useLoad } from '../tanks/useLoad'
import { formatVolume, grossLiters, type Volume } from '../tanks/volume'

const steps = ['who', 'size', 'water'] as const
const numerals = ['I', 'II', 'III']

/** The fields each step asks for, to show only that step's problems when going on. */
const stepFields: Record<number, ReadonlyArray<keyof TankForm>> = {
  0: ['name', 'startDate'],
  1: ['lengthCm', 'widthCm', 'heightCm'],
  2: ['netVolumeLiters', 'note'],
}

const dimensionField = { length: 'lengthCm', width: 'widthCm', height: 'heightCm' } as const satisfies Record<Dimension, keyof TankForm>

/** Creating a tank (/tanks/new) and editing one (/tanks/:id/edit) share this form: three steps beside the plate they make. */
export function TankFormPage() {
  const { id } = useParams()
  const loaded = useLoad(() => Promise.all([id ? api.tank(id) : Promise.resolve(null), api.tanks()]), id ?? 'new')

  if (loaded.status === 'loading') return null
  if (loaded.status === 'error') return <LoadError error={loaded.error} />
  const [tank, tanks] = loaded.data
  const number = tank ? (plateNumber(tanks, tank.id) ?? tanks.length) : tanks.length + 1
  return <TankFormScreen tank={tank} number={number} />
}

function TankFormScreen({ tank, number }: { tank: Tank | null; number: number }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState<TankForm>(() => (tank ? formFromTank(tank, language) : emptyForm))
  const [knowsNet, setKnowsNet] = useState(tank?.netVolumeLiters != null)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [focus, setFocus] = useState<Dimension | null>(null)
  const [example, setExample] = useState(30)

  const read = (text: string) => {
    const value = parseNumber(text)
    return typeof value === 'number' ? value : null
  }
  const dimensions = { length: read(form.lengthCm), width: read(form.widthCm), height: read(form.heightCm) }
  const gross = grossLiters(dimensions.length, dimensions.width, dimensions.height)
  const net = knowsNet ? read(form.netVolumeLiters) : null
  const volume: Volume | null = net !== null && net > 0 ? { liters: net, kind: 'net' } : gross !== null ? { liters: gross, kind: 'gross' } : null

  const message = (key: FormErrors[keyof FormErrors]) => key && t(key, { example: formatNumber(80.5, language) })
  const change = (field: keyof TankForm, value: string) => setForm({ ...form, [field]: value })
  const unknownNetCleared = (): TankForm => (knowsNet ? form : { ...form, netVolumeLiters: '' })

  /** What was typed, or the problems, in the order of the steps. */
  function check() {
    return toDetails(unknownNetCleared())
  }

  function next() {
    const checked = check()
    if ('errors' in checked) {
      const own = Object.fromEntries(Object.entries(checked.errors).filter(([field]) => stepFields[step].includes(field as keyof TankForm)))
      if (Object.keys(own).length > 0) {
        setErrors(own)
        return
      }
    }
    setErrors({})
    setStep(step + 1)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const checked = check()
    if ('errors' in checked) {
      setErrors(checked.errors)
      const first = steps.findIndex((_, i) => stepFields[i].some((field) => checked.errors[field]))
      if (first !== -1) setStep(first)
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

  const dimension = (key: Dimension) => {
    const field = dimensionField[key]
    const label = t(`tanks.form.${key}`)
    return (
      <TextField
        key={key}
        name={field}
        label={label}
        inputMode="decimal"
        autoComplete="off"
        unit="cm"
        value={form[field]}
        error={message(errors[field])}
        onChange={(event) => change(field, event.target.value)}
        onFocus={() => setFocus(key)}
        onBlur={() => setFocus(null)}
        nudge={{
          onNudge: (direction) => {
            setForm({ ...form, [field]: stepped(form[field], direction, dimensionStep, dimensionStart[key], language) })
            setFocus(key)
          },
          decrementLabel: t('tanks.form.decrease', { name: label.toLowerCase() }),
          incrementLabel: t('tanks.form.increase', { name: label.toLowerCase() }),
        }}
      />
    )
  }

  const title = t(`tanks.form.steps.${steps[step]}.title`)
  const lastStep = step === steps.length - 1
  // Editing a tank can go to any step and save from any of them; creating one goes through them in order.
  const free = tank !== null

  return (
    <>
      <PageHeader title={tank ? t('tanks.form.editTitle') : t('tanks.form.newTitle')} />

      <div className="grid w-full max-w-[1040px] gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <form onSubmit={submit} noValidate aria-busy={saving} className="flex min-w-0 flex-col gap-6">
          <ol className="m-0 flex list-none items-center gap-3 p-0">
            {steps.map((name, i) => {
              const reachable = free || i <= step
              return (
                <li key={name} className="flex items-center gap-3" aria-current={i === step ? 'step' : undefined}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => setStep(i)}
                    aria-label={t('tanks.form.stepLabel', { number: i + 1, title: t(`tanks.form.steps.${name}.title`) })}
                    className={cx('cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default', !reachable && 'opacity-50')}
                  >
                    <Stamp
                      size="sm"
                      tone={i < step ? 'forest' : i === step ? 'neon' : 'muted'}
                      dashed={i > step}
                      rotate={i === step ? -6 : 0}
                      main={i < step ? '✓' : numerals[i]}
                    />
                  </button>
                  {i < steps.length - 1 && <span aria-hidden="true" className={cx('h-px w-8 sm:w-14', i < step ? 'bg-forest' : 'bg-ink/35')} />}
                </li>
              )
            })}
          </ol>

          <div key={step} className="rise flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-h2 font-normal">{title}</h2>
              <p className="m-0 max-w-[48ch] text-lead text-ink-soft">{t(`tanks.form.steps.${steps[step]}.lead`)}</p>
            </div>

            {step === 0 && (
              <div className="flex flex-col gap-6">
                <TextField
                  name="name"
                  autoComplete="off"
                  label={t('tanks.form.name')}
                  placeholder={t('tanks.form.namePlaceholder')}
                  value={form.name}
                  error={message(errors.name)}
                  onChange={(event) => change('name', event.target.value)}
                />
                <TextField
                  name="startDate"
                  type="date"
                  label={t('tanks.form.startDate')}
                  className="max-w-[16rem]"
                  value={form.startDate}
                  error={message(errors.startDate)}
                  onChange={(event) => change('startDate', event.target.value)}
                />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div role="group" aria-label={t('tanks.form.commonSizes')} className="flex flex-col gap-2">
                  <span className="font-mono text-caption tracking-[0.12em] text-ink-muted uppercase">{t('tanks.form.commonSizes')}</span>
                  <div className="flex flex-wrap gap-2">
                    {commonSizes.map((size) => {
                      const on = dimensions.length === size.length && dimensions.width === size.width && dimensions.height === size.height
                      return (
                        <ToggleChip
                          key={`${size.length}x${size.width}x${size.height}`}
                          variant="check"
                          pressed={on}
                          onClick={() =>
                            setForm({
                              ...form,
                              lengthCm: formatNumber(size.length, language, { grouping: false }),
                              widthCm: formatNumber(size.width, language, { grouping: false }),
                              heightCm: formatNumber(size.height, language, { grouping: false }),
                            })
                          }
                        >
                          <span className="whitespace-nowrap">
                            {size.length}×{size.width}×{size.height}
                          </span>
                          <span className="whitespace-nowrap text-ink-muted">
                            · {formatVolume({ liters: (size.length * size.width * size.height) / 1000, kind: 'gross' }, language)}&nbsp;L
                          </span>
                        </ToggleChip>
                      )
                    })}
                  </div>
                </div>
                <div className="flex max-w-xs flex-col gap-4">
                  {dimension('length')}
                  {dimension('width')}
                  {dimension('height')}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div role="group" aria-label={t('tanks.form.netVolume')} className="flex flex-wrap gap-2">
                    <ToggleChip variant="check" pressed={knowsNet} onClick={() => setKnowsNet(true)}>
                      {t('tanks.form.netKnown')}
                    </ToggleChip>
                    <ToggleChip variant="check" pressed={!knowsNet} onClick={() => setKnowsNet(false)}>
                      {t('tanks.form.netUnknown')}
                    </ToggleChip>
                  </div>
                  {knowsNet ? (
                    <TextField
                      name="netVolumeLiters"
                      label={t('tanks.form.netVolume')}
                      inputMode="decimal"
                      autoComplete="off"
                      unit="L"
                      placeholder={gross === null ? undefined : formatNumber(Math.round(gross), language)}
                      className="max-w-sm"
                      value={form.netVolumeLiters}
                      error={message(errors.netVolumeLiters)}
                      onChange={(event) => change('netVolumeLiters', event.target.value)}
                      nudge={{
                        onNudge: (direction) =>
                          change('netVolumeLiters', stepped(form.netVolumeLiters, direction, volumeStep, gross === null ? 100 : Math.round(gross), language)),
                        decrementLabel: t('tanks.form.decrease', { name: t('tanks.form.netVolume').toLowerCase() }),
                        incrementLabel: t('tanks.form.increase', { name: t('tanks.form.netVolume').toLowerCase() }),
                      }}
                    />
                  ) : (
                    <Handwritten as="p" size="sm" className="m-0 max-w-[40ch] -rotate-1">
                      {t('tanks.form.netSoftNote')}
                    </Handwritten>
                  )}
                </div>
                <NoteField name="note" label={t('tanks.form.note')} value={form.note} error={message(errors.note)} onChange={(event) => change('note', event.target.value)} />
              </div>
            )}

            {errors.general && <FormError>{message(errors.general)}</FormError>}
            <div className="flex flex-wrap items-center gap-3">
              {step > 0 && (
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
                  {t('tanks.form.back')}
                </Button>
              )}
              {!lastStep && (
                <Button type="button" size="lg" iconEnd="arrowRight" variant={free ? 'secondary' : 'primary'} onClick={next}>
                  {t('tanks.form.next')}
                </Button>
              )}
              {(lastStep || free) && (
                <Button type="submit" size="lg" icon="check" disabled={saving}>
                  {saving ? t('tanks.form.saving') : t('tanks.form.save')}
                </Button>
              )}
              <ButtonLink to={tank ? `/tanks/${tank.id}` : '/tanks'} variant="dashed" size="lg">
                {t('tanks.form.cancel')}
              </ButtonLink>
            </div>
          </div>
        </form>

        <div className="self-start lg:sticky lg:top-6">
          <TankPlatePreview
            number={number}
            name={form.name.trim()}
            startDate={form.startDate}
            dimensions={dimensions}
            volume={volume}
            showVolume={step > 0}
            focus={focus}
            example={example}
            onExample={setExample}
          />
        </div>
      </div>
    </>
  )
}

/** Where a dimension starts when its − or + is pressed on an empty field. */
const dimensionStart: Record<Dimension, number> = { length: 80, width: 35, height: 45 }

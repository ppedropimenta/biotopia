import type { TFunction } from 'i18next'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '../components/ui/Icon'
import { RangeRuler } from '../components/ui/Measures'
import { cx } from '../lib/cx'
import { valueDecimals, type ErrorKey, type Measurement, type Parameter, type ParameterCode } from './measurements'
import { nudge } from './nudge'
import { formatNumber, parseNumber } from './numbers'
import { useLanguage } from './useLanguage'
import { useMeasurementMessage } from './useMeasurementMessage'

/** Rarely measured, so they wait behind "More parameters" unless this tank already has a value for one. */
const seldom: readonly ParameterCode[] = ['phosphate', 'tds', 'iron', 'potassium']

type Props = {
  parameters: Parameter[]
  latest: Measurement[]
  values: Partial<Record<ParameterCode, string>>
  errors: Partial<Record<ParameterCode, ErrorKey>>
  onChange: (parameter: Parameter, text: string) => void
}

/**
 * Every Parameter as a tile, like the latest values on the tank page. A tile shows the last value, dimmed; touching it
 * opens its number for typing (with − and + and the ruler following), Enter moves to the next tile, and a tile with
 * a value turns dark with how it moved from the last one. Only the tiles with a value are sent.
 */
export function MeasurementGrid({ parameters, latest, values, errors, onChange }: Props) {
  const { t } = useTranslation()
  const [active, setActive] = useState<ParameterCode | null>(null)
  const lastOf = (parameter: Parameter) => latest.find((m) => m.parameter === parameter.code)?.value ?? null
  const hasSeldom = parameters.some((p) => seldom.includes(p.code) && (lastOf(p) !== null || values[p.code]))
  const [more, setMore] = useState(hasSeldom)
  const shown = parameters.filter((p) => more || !seldom.includes(p.code))
  const hidden = parameters.filter((p) => !shown.includes(p))

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-3">
      {shown.map((parameter, i) => (
        <Tile
          key={parameter.code}
          parameter={parameter}
          last={lastOf(parameter)}
          value={values[parameter.code] ?? ''}
          error={errors[parameter.code]}
          active={active === parameter.code}
          onOpen={() => setActive(parameter.code)}
          onClose={() => setActive((current) => (current === parameter.code ? null : current))}
          onNext={() => setActive(shown[i + 1]?.code ?? null)}
          onChange={(text) => onChange(parameter, text)}
        />
      ))}
      {hidden.length > 0 && (
        <button
          type="button"
          onClick={() => setMore(true)}
          className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-1.5 border-[1.5px] border-dashed border-ink/55 bg-transparent p-3 text-center text-ink-soft hover:text-ink"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            +
          </span>
          <span className="text-base">{t('measurements.form.more')}</span>
          <span className="font-mono text-caption">{t('measurements.form.moreHint')}</span>
        </button>
      )}
    </div>
  )
}

function Tile({
  parameter,
  last,
  value,
  error,
  active,
  onOpen,
  onClose,
  onNext,
  onChange,
}: {
  parameter: Parameter
  last: number | null
  value: string
  error: ErrorKey | undefined
  active: boolean
  onOpen: () => void
  onClose: () => void
  onNext: () => void
  onChange: (text: string) => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const message = useMeasurementMessage()
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (active) input.current?.select()
  }, [active])

  const name = t(`parameters.${parameter.code}`)
  const show = (n: number) => formatNumber(n, language, { grouping: false, maxDecimals: valueDecimals })
  const typed = (() => {
    const parsed = parseNumber(value)
    return typeof parsed === 'number' ? parsed : null
  })()
  const withUnit = (n: number) => `${show(n)} ${parameter.unit}`.trim()
  const unit = parameter.unit && <span className="font-mono text-sm">{parameter.unit}</span>
  const ruler = (n: number | null) => (
    <RangeRuler
      scale={[parameter.min, parameter.max]}
      value={n ?? undefined}
      ariaLabel={
        n === null
          ? name
          : t('measurements.latest.rulerLabel', {
              parameter: name,
              value: withUnit(n),
              min: show(parameter.min),
              max: show(parameter.max),
            })
      }
    />
  )
  const tile = 'flex min-h-44 flex-col gap-1 px-3.5 pt-3 pb-2.5 text-left'

  if (active) {
    return (
      <div
        className={cx(tile, 'border-2 border-ink texture-card')}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) onClose()
        }}
      >
        <span className="font-mono text-caption text-ink-muted">{name}</span>
        <input
          ref={input}
          autoFocus
          inputMode="decimal"
          autoComplete="off"
          aria-label={name}
          aria-invalid={error ? true : undefined}
          value={value}
          placeholder={last === null ? '' : show(last)}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onNext()
            } else if (event.key === 'Escape') onClose()
          }}
          className="w-full min-w-0 border-0 bg-transparent p-0 text-center text-h2 leading-[1.05] text-ink placeholder:text-ink-muted/40"
        />
        <div className="flex items-center justify-between">
          <StepButton
            label={t('measurements.form.decrease', { name })}
            onClick={() => onChange(nudge(value, -1, parameter, last, language))}
          >
            −
          </StepButton>
          {unit}
          <StepButton
            label={t('measurements.form.increase', { name })}
            onClick={() => onChange(nudge(value, 1, parameter, last, language))}
          >
            +
          </StepButton>
        </div>
        {ruler(typed)}
        {last !== null && (
          <span className="font-mono text-caption text-ink-muted">{t('measurements.form.last', { value: withUnit(last) })}</span>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cx(tile, 'cursor-pointer border-2 border-cardinal texture-card text-ink')}
      >
        <span className="font-mono text-caption text-ink-muted">{name}</span>
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-h2 leading-[1.05]">{value}</span>
          {unit}
        </span>
        <span role="alert" className="mt-auto flex items-start gap-1.5 font-mono text-caption text-cardinal">
          <Icon name="warning" size={16} strokeWidth={2} className="flex-none" />
          {message(error, parameter)}
        </span>
      </button>
    )
  }

  if (typed !== null) {
    return (
      <button type="button" onClick={onOpen} className={cx(tile, 'cursor-pointer border border-ink bg-ink text-paper-card')}>
        <span className="flex justify-between gap-2 font-mono text-caption text-river-text">
          <span>{name}</span>
          <Icon name="check" size={16} strokeWidth={2} />
        </span>
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-h2 leading-[1.05]">{show(typed)}</span>
          {unit}
        </span>
        <span className="mt-auto font-mono text-caption text-river-text">{change(typed, last, show, t)}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(tile, 'cursor-pointer border border-ink texture-card text-ink hover:bg-paper-card')}
    >
      <span className="font-mono text-caption text-ink-muted">{name}</span>
      <span className="flex flex-wrap items-baseline gap-x-1.5 text-ink-muted/60">
        <span className="text-h2 leading-[1.05]">{last === null ? '—' : show(last)}</span>
        {unit}
      </span>
      <span className="mt-auto flex flex-col gap-1">
        {ruler(last)}
        <span className="font-mono text-caption text-ink-muted">
          {last === null ? t('measurements.form.neverMeasured') : t('measurements.form.tapToType')}
        </span>
      </span>
    </button>
  )
}

/** How a typed value moved from the last one, in a symbol and words. */
function change(
  value: number,
  last: number | null,
  show: (n: number) => string,
  t: TFunction,
) {
  if (last === null) return t('measurements.form.firstTime')
  const amount = Math.round(Math.abs(value - last) * 10 ** valueDecimals) / 10 ** valueDecimals
  if (amount === 0) return t('measurements.form.sameAsLast')
  return t('measurements.form.sinceLast', { symbol: value > last ? '▲' : '▼', amount: show(amount) })
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 flex-none cursor-pointer items-center justify-center bg-transparent text-h3 text-ink hover:bg-paper"
    >
      {children}
    </button>
  )
}

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { formatNumber, parseNumber } from '../../tanks/numbers'
import { useLanguage } from '../../tanks/useLanguage'
import { Icon } from './Icon'

const labelClasses = 'font-mono text-caption tracking-[0.12em] text-ink-muted uppercase'

/**
 * An underlined field, like a notebook line. A mono label on top; an optional unit on the right. An `error`
 * (already in the chosen language) replaces the hint, with a mark and words, so colour is not the only signal.
 */
export function TextField({
  label,
  unit,
  hint,
  error,
  nudge,
  keepCase = false,
  className,
  inputClassName,
  ...input
}: {
  label: string
  unit?: string
  hint?: ReactNode
  error?: string
  /** − and + buttons beside the input, for values that move in steps. The labels are in the chosen language. */
  nudge?: { onNudge: (direction: 1 | -1) => void; decrementLabel: string; incrementLabel: string }
  /** Keeps the label's own capitals, for a name whose case means something (pH, Fe). */
  keepCase?: boolean
  inputClassName?: string
} & ComponentProps<'input'>) {
  const id = useId()
  const noteId = `${id}-note`
  const nudgeButton = 'flex size-11 flex-none cursor-pointer items-center justify-center bg-transparent text-h3 text-ink hover:bg-paper-card'
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={id} className={cx(labelClasses, keepCase && 'normal-case')}>
        {label}
      </label>
      <span className={cx('flex gap-1 border-b-[1.5px] border-ink', nudge ? 'items-center' : 'items-baseline')}>
        {nudge && (
          <button type="button" aria-label={nudge.decrementLabel} className={nudgeButton} onClick={() => nudge.onNudge(-1)}>
            −
          </button>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? noteId : undefined}
          className={cx(
            'min-h-11 w-full min-w-0 border-0 bg-transparent px-0.5 font-serif text-lead text-ink placeholder:text-ink-muted/70',
            inputClassName,
          )}
          {...input}
        />
        {unit && <span className="font-mono text-xs">{unit}</span>}
        {nudge && (
          <button type="button" aria-label={nudge.incrementLabel} className={nudgeButton} onClick={() => nudge.onNudge(1)}>
            +
          </button>
        )}
      </span>
      {error ? (
        <span id={noteId} role="alert" className="flex items-center gap-2 font-mono text-xs text-cardinal">
          <Icon name="warning" size={16} strokeWidth={2} />
          {error}
        </span>
      ) : (
        hint && (
          <span id={noteId} className="font-mono text-xs text-ink-muted">
            {hint}
          </span>
        )
      )}
    </div>
  )
}

/** A free note on ruled paper. An `error` (in the chosen language) shows under it, like in `TextField`. */
export function NoteField({
  label,
  error,
  className,
  ...rest
}: { label: string; error?: string } & ComponentProps<'textarea'>) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <textarea
        id={id}
        rows={2}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="ruled resize-y border-0 bg-transparent px-0.5 font-hand text-hand leading-[30px] text-ink-blue placeholder:text-ink-muted/70"
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" className="flex items-center gap-2 font-mono text-xs text-cardinal">
          <Icon name="warning" size={16} strokeWidth={2} />
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * A number with a step, for values that move in whole steps (temperature, GH, KH). It reads and shows the
 * number the way the language writes it. The − and + buttons are named by the caller, in the language.
 */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  digits = 1,
  unit,
  decrementLabel,
  incrementLabel,
  hint,
  layout = 'row',
  className,
}: {
  label: ReactNode
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  digits?: number
  unit?: string
  decrementLabel: string
  incrementLabel: string
  hint?: ReactNode
  /** "row": label on the left; "stack": label on top and a wide control. */
  layout?: 'row' | 'stack'
  className?: string
}) {
  const id = useId()
  const language = useLanguage()
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? formatNumber(value, language, { grouping: false, maxDecimals: digits })
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10 ** digits) / 10 ** digits))
  const commit = () => {
    if (draft === null) return
    const parsed = parseNumber(draft, language)
    if (typeof parsed === 'number') onChange(clamp(parsed))
    setDraft(null)
  }
  const button = 'flex h-11 w-11 cursor-pointer items-center justify-center bg-transparent font-serif text-h3 text-ink hover:bg-paper'
  return (
    <div className={cx(layout === 'row' ? 'flex items-center justify-between gap-2.5' : 'flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex flex-col">
        <span className="text-lead">{label}</span>
        {hint && <span className="font-mono text-caption text-ink-muted">{hint}</span>}
      </label>
      <div className={cx('flex items-center rounded-paper border-[1.5px] border-ink bg-paper-card', layout === 'stack' && 'w-full')}>
        <button type="button" aria-label={decrementLabel} className={cx(button, 'border-r border-ink/40')} onClick={() => onChange(clamp(value - step))}>
          −
        </button>
        <input
          id={id}
          inputMode="decimal"
          value={shown}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => event.key === 'Enter' && commit()}
          className={cx('h-11 w-16 min-w-0 border-0 bg-transparent text-center font-serif text-h3 text-ink', layout === 'stack' && 'flex-1')}
        />
        {unit && <span className="pr-1.5 font-mono text-xs">{unit}</span>}
        <button type="button" aria-label={incrementLabel} className={cx(button, 'border-l border-ink/40')} onClick={() => onChange(clamp(value + step))}>
          +
        </button>
      </div>
    </div>
  )
}

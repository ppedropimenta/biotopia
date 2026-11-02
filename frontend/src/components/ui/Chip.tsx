import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * Filter chips (buttons with aria-pressed) and static tags.
 *
 * ToggleChip variant:
 *  - "solid": pressed = full ink
 *  - "check": pressed = a tick and a firm border; off = dashed
 *  - "accent": pressed = full neon blue
 */
export function ToggleChip({
  pressed,
  variant = 'solid',
  className,
  children,
  ...rest
}: {
  pressed: boolean
  variant?: 'solid' | 'check' | 'accent'
  children: ReactNode
} & Omit<ComponentProps<'button'>, 'aria-pressed'>) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(
        'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 font-mono text-label transition-colors',
        variant === 'solid' &&
          (pressed ? 'border border-ink bg-ink text-paper-card' : 'border border-ink/50 text-ink hover:bg-paper-card'),
        variant === 'check' &&
          (pressed
            ? 'border-[1.5px] border-ink bg-paper-card text-ink'
            : 'border border-dashed border-ink/50 text-ink-soft hover:bg-paper-card'),
        variant === 'accent' &&
          (pressed
            ? 'border-[1.5px] border-neon bg-neon text-paper-card'
            : 'border border-ink/50 text-ink hover:bg-paper-card'),
        className,
      )}
      {...rest}
    >
      {variant !== 'solid' && pressed && <span aria-hidden="true">✓</span>}
      {children}
    </button>
  )
}

/** A group of chips with a mono label on the left. */
export function ChipGroup({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cx('flex flex-wrap items-center gap-1.5', className)}>
      <span aria-hidden="true" className="mr-1 font-mono text-label tracking-[0.1em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

/** A short static label. Tone: default, warn (cardinal border), danger (full cardinal), plant (dashed green). */
export function Tag({
  tone = 'default',
  className,
  children,
}: {
  tone?: 'default' | 'warn' | 'danger' | 'plant'
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center px-[7px] py-px font-mono text-caption',
        tone === 'default' && 'border border-ink/50',
        tone === 'warn' && 'border border-cardinal text-cardinal',
        tone === 'danger' && 'bg-cardinal text-paper-card',
        tone === 'plant' && 'border border-dashed border-forest text-forest',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A segmented switch between exclusive views (Chart | Table). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('flex rounded-paper border-[1.5px] border-ink font-mono text-sm', className)}
    >
      {options.map((option, i) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cx(
            'min-h-11 cursor-pointer px-4',
            i > 0 && 'border-l border-ink/40',
            option.value === value ? 'bg-ink text-paper-card' : 'bg-transparent text-ink hover:bg-paper-card',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

import { cx } from '../../lib/cx'

/**
 * Buttons and links that look like buttons. The text comes from the translations in normal case; the
 * capitals are CSS, so tests find them by their normal name. At least 44px high (touch target).
 *
 * primary   ink on paper (the main action of the screen)
 * secondary ink outline
 * amber     amber on blackwater (the main action on dark)
 * dashed    dashed, for "add" and optional actions
 * onDark    light outline on blackwater
 */
export type ButtonVariant = 'primary' | 'secondary' | 'amber' | 'dashed' | 'onDark'
export type ButtonSize = 'md' | 'lg'

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cx(
    'group inline-flex cursor-pointer items-center justify-center gap-2 rounded-paper font-mono no-underline',
    'transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.97]',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    size === 'md' ? 'min-h-11 px-4 text-button' : 'min-h-12 px-[1.375rem] text-sm',
    variant !== 'dashed' && 'tracking-[0.06em] uppercase',
    variant === 'primary' && 'bg-ink text-paper-card hover:bg-ink-soft hover:text-paper-card',
    variant === 'secondary' && 'border-[1.5px] border-ink text-ink hover:bg-paper-card hover:text-ink',
    variant === 'amber' && 'bg-amber font-medium text-blackwater hover:bg-amber-soft hover:text-blackwater',
    variant === 'dashed' && 'border-[1.5px] border-dashed border-ink/55 text-ink hover:bg-paper-card hover:text-ink',
    variant === 'onDark' && 'border border-river-bright/60 text-river-bright hover:bg-blackwater-raised hover:text-river-bright',
    className,
  )
}

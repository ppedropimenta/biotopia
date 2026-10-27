import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * A rubber stamp: maintenance in the logbook and on the timeline, and seals such as "Demo". A double border,
 * turned a little.
 */
export type StampTone = 'neon' | 'cardinal' | 'forest' | 'ochre' | 'ink' | 'muted' | 'amber'
export type StampSize = 'sm' | 'md' | 'lg' | 'xl'

const tones: Record<StampTone, string> = {
  neon: 'text-neon border-neon',
  cardinal: 'text-cardinal border-cardinal',
  forest: 'text-forest border-forest',
  ochre: 'text-ochre border-ochre',
  ink: 'text-ink border-ink',
  muted: 'text-ink-muted border-ink-muted',
  amber: 'text-amber border-amber',
}

const sizes: Record<StampSize, { box: string; small: string; big: string; px: number; bigPx: number }> = {
  sm: { box: 'size-10 border-2', small: 'text-[0.625rem]', big: 'text-[0.625rem]', px: 40, bigPx: 10 },
  md: { box: 'size-16 border-[2.5px]', small: 'text-[0.625rem]', big: 'text-base', px: 64, bigPx: 16 },
  lg: { box: 'size-21 border-[3px]', small: 'text-[0.6875rem]', big: 'text-[1.3125rem]', px: 84, bigPx: 21 },
  xl: { box: 'size-28 border-4', small: 'text-[0.6875rem]', big: 'text-[1.0625rem]', px: 112, bigPx: 17 },
}

/** Shrinks the main line to fit the circle. Mono type is about 0.6 em wide per character. */
function fitMain(main: ReactNode, size: StampSize): number | undefined {
  if (typeof main !== 'string') return undefined
  const { px, bigPx } = sizes[size]
  const fit = (px * 0.78) / (main.length * 0.62)
  return fit < bigPx ? Math.max(7, Math.floor(fit * 10) / 10) : undefined
}

type StampProps = {
  tone?: StampTone
  size?: StampSize
  /** Degrees; positive turns clockwise. */
  rotate?: number
  /** The small top line. */
  top?: ReactNode
  /** The main line. */
  main?: ReactNode
  /** The small bottom line. */
  bottom?: ReactNode
  /** The full text for screen readers, when the lines alone are not enough. */
  label?: string
  dashed?: boolean
  className?: string
}

export function Stamp({ tone = 'neon', size = 'md', rotate = -8, top, main, bottom, label, dashed, className }: StampProps) {
  const s = sizes[size]
  const fitted = fitMain(main, size)
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cx(
        'inline-flex shrink-0 flex-col items-center justify-center rounded-full text-center font-mono leading-[1.15]',
        dashed ? 'border-[1.5px] border-dashed' : 'border-double',
        s.box,
        tones[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {top && <span className={cx(s.small, 'tracking-[0.08em] uppercase')}>{top}</span>}
      {main && (
        <b className={cx(s.big, 'font-medium uppercase')} style={fitted ? { fontSize: `${fitted}px` } : undefined}>
          {main}
        </b>
      )}
      {bottom && <span className={cx(s.small, 'uppercase')}>{bottom}</span>}
    </span>
  )
}

import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/** A handwritten note (Caveat), only for what the keeper "wrote". Blue by default; red for their own alerts. */
export function Handwritten({
  as: Tag = 'span',
  tone = 'blue',
  size = 'md',
  className,
  children,
}: {
  as?: 'span' | 'p' | 'div' | 'figcaption' | 'blockquote'
  tone?: 'blue' | 'red' | 'ink'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}) {
  return (
    <Tag
      className={cx(
        'font-hand leading-[1.2]',
        size === 'sm' && 'text-[1.1875rem]',
        size === 'md' && 'text-hand',
        size === 'lg' && 'text-[1.8125rem] leading-[1.17]',
        tone === 'blue' && 'text-ink-blue',
        tone === 'red' && 'text-cardinal',
        tone === 'ink' && 'text-ink',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/** A strip of sticky tape, decorative; place it with `className` (absolute ...). */
export function Tape({ className, rotate = -3 }: { className?: string; rotate?: number }) {
  return (
    <span
      aria-hidden="true"
      className={cx('pointer-events-none absolute h-5 w-[4.5rem] bg-tape', className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    />
  )
}

/** A museum specimen label: a string hole on the left and "label value" rows. */
export function SpecimenLabel({
  rows,
  rotate = -1.5,
  className,
}: {
  rows: ReadonlyArray<{ label: string; value: ReactNode }>
  rotate?: number
  className?: string
}) {
  return (
    <div
      className={cx('relative max-w-sm border border-ink bg-paper-photo py-3 pr-4 pl-8 text-[0.9375rem] leading-[1.45]', className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span aria-hidden="true" className="absolute top-1/2 left-2.5 -mt-[5px] size-2.5 rounded-full border border-ink bg-paper" />
      <dl className="m-0">
        {rows.map((row, i) => (
          <div key={i}>
            <dt className="inline font-mono text-caption text-ink-muted uppercase">{row.label} </dt>
            <dd className="m-0 inline">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * A polaroid: a photo in a frame with a handwritten caption and, if you like, tape. `zoom` crops a detail of
 * the same image. `darkBackground` is for the drawn fish.
 */
export function Polaroid({
  src,
  alt,
  caption,
  rotate = -2,
  aspect = '4 / 3',
  tape = false,
  zoom,
  darkBackground = false,
  imgClassName,
  className,
}: {
  src: string
  alt: string
  caption?: ReactNode
  rotate?: number
  aspect?: string
  tape?: boolean
  zoom?: { scale: number; origin: string }
  darkBackground?: boolean
  imgClassName?: string
  className?: string
}) {
  return (
    <figure
      className={cx('relative m-0 bg-paper-photo px-2 pt-2 pb-1 text-ink shadow-photo', className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {tape && <Tape className="-top-2.5 left-1/2 -ml-9" rotate={3} />}
      <div
        className={cx('overflow-hidden', darkBackground && 'flex items-center justify-center bg-water-black')}
        style={{ aspectRatio: aspect }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cx(darkBackground ? 'block h-auto w-[90%]' : 'block size-full object-cover', imgClassName)}
          style={zoom ? { transform: `scale(${zoom.scale})`, transformOrigin: zoom.origin } : undefined}
        />
      </div>
      {caption && <figcaption className="px-0.5 pt-0.5 font-hand text-[1.3125rem] leading-[1.3]">{caption}</figcaption>}
    </figure>
  )
}

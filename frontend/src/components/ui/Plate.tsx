import type { ElementType, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { plateClasses, type PlateSize } from './plateClasses'

/**
 * Plate: the card of the app. Textured paper, an ink border and a double rule inside, like a naturalist's
 * plates. The corners ("Plate I · Fig. 1") are decoration and stay out of screen readers.
 *
 * Use `plateClasses()` (plateClasses.ts) when the whole plate is a link.
 */
type PlateProps = {
  as?: ElementType
  size?: PlateSize
  /** Up to three short texts on top: left, centre, right. */
  corners?: readonly ReactNode[]
  className?: string
  children: ReactNode
  id?: string
  [key: `aria-${string}`]: string | undefined
}

export function Plate({ as: Tag = 'section', size = 'md', corners, className, children, ...rest }: PlateProps) {
  return (
    <Tag className={plateClasses(size, className)} {...rest}>
      {corners && corners.length > 0 && <PlateCorners items={corners} />}
      {children}
    </Tag>
  )
}

export function PlateCorners({ items, className }: { items: readonly ReactNode[]; className?: string }) {
  const last = items.length - 1
  return (
    <div aria-hidden="true" className={cx('plate-corner flex justify-between gap-3', className)}>
      {items.map((item, i) => (
        <span
          key={i}
          className={cx(
            i === 0 || i === last ? 'whitespace-nowrap' : 'min-w-0 text-center',
            i === last && i > 0 && 'text-right',
          )}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

import { cx } from '../../lib/cx'

export type PlateSize = 'sm' | 'md' | 'lg'

export function plateClasses(size: PlateSize = 'md', className?: string) {
  return cx(
    'relative block texture-card border border-ink text-ink',
    size === 'sm' && 'px-4 pt-3.5 pb-4 shadow-plate-sm',
    size === 'md' && 'px-5 pt-4 pb-5 shadow-plate',
    size === 'lg' && 'px-8 pt-6 pb-7 shadow-plate',
    className,
  )
}

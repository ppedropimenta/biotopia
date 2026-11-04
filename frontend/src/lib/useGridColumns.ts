import { useLayoutEffect, useState } from 'react'

/**
 * How many columns a CSS grid has right now, which depends on its width (an auto-fill grid). Put the second value on
 * the grid as its `ref`. The count is null until the grid has been measured, which happens before the first paint.
 */
export function useGridColumns() {
  const [columns, setColumns] = useState<number | null>(null)
  const [grid, setGrid] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!grid) return
    const measure = () => setColumns(getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [grid])

  return [columns, setGrid] as const
}

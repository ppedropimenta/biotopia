import { useLayoutEffect, useState } from 'react'

/**
 * The width of an element in pixels, kept up to date. Put the second value on the element as its `ref`. The width is
 * 0 until the element has been measured, which happens before the first paint. A chart drawn in real pixels, not in a
 * scaled viewBox, keeps its type the same size on a phone.
 */
export function useElementWidth() {
  const [width, setWidth] = useState(0)
  const [element, setElement] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!element) return
    const measure = () => setWidth(Math.round(element.getBoundingClientRect().width))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return [width, setElement] as const
}

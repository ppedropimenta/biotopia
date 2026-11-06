import { useEffect, useRef, useState } from 'react'

/** A value that eases toward its target, so a drawing grows instead of jumping. */
export function useSmooth(target: number, ms = 380): number {
  const [value, setValue] = useState(target)
  const shown = useRef(target)
  useEffect(() => {
    // For people who ask for less motion the target is reached on the first frame.
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms
    const from = shown.current
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration)
      shown.current = from + (target - from) * (1 - Math.pow(1 - progress, 3))
      setValue(shown.current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return value
}

/** Ranges and linear scales for the ruler. Pure functions, covered by ranges.test.ts. */

export type Range = readonly [min: number, max: number]
export type RangeStatus = 'below' | 'within' | 'above'

/** Where a value falls against a closed range [min, max]. */
export function rangeStatus(value: number, range: Range): RangeStatus {
  const [min, max] = range
  if (value < min) return 'below'
  if (value > max) return 'above'
  return 'within'
}

/** Linear scale from a domain to a range. `clamp` keeps the result inside the range. */
export function scaleLinear(domain: Range, range: Range, clamp = false): (value: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return (value) => {
    const out = r0 + ((value - d0) / span) * (r1 - r0)
    if (!clamp) return out
    return Math.min(Math.max(r0, r1), Math.max(Math.min(r0, r1), out))
  }
}

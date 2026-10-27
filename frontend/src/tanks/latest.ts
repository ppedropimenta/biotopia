import { valueDecimals, type Measurement, type Parameter } from './measurements'

export type Change = { direction: 'up' | 'down' | 'same'; amount: number }

/** How a value moved from the one before it. The amount is rounded to the decimals the API keeps. */
export function changeBetween(previous: number, latest: number): Change {
  const factor = 10 ** valueDecimals
  const amount = Math.round(Math.abs(latest - previous) * factor) / factor
  if (amount === 0) return { direction: 'same', amount: 0 }
  return { direction: latest > previous ? 'up' : 'down', amount }
}

export type LatestValue = { measurement: Measurement; parameter: Parameter; change: Change | null }

/**
 * One entry per Parameter ever measured in the tank, in the order of the Parameter list. `history` is the
 * tank's Measurements, newest first: the change is against the next older Measurement of the same Parameter,
 * or null when there is none (or the history does not reach the latest one).
 */
export function latestValues(
  parameters: readonly Parameter[],
  latest: readonly Measurement[],
  history: readonly Measurement[],
): LatestValue[] {
  return parameters.flatMap((parameter) => {
    const measurement = latest.find((m) => m.parameter === parameter.code)
    if (!measurement) return []
    const at = history.findIndex((m) => m.id === measurement.id)
    const previous = at === -1 ? undefined : history.slice(at + 1).find((m) => m.parameter === parameter.code)
    return [{ measurement, parameter, change: previous ? changeBetween(previous.value, measurement.value) : null }]
  })
}

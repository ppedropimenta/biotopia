import type { Measurement, ParameterCode } from './measurements'

/** How many Parameters a plate on the tank list shows. */
const plateSlots = 3

/**
 * The order a plate prefers its Parameters in: the three main ones, then the rest by how often a keeper reads them
 * (the nitrogen cycle first).
 */
export const plateOrder = [
  'ph',
  'temperature',
  'total_ammonia',
  'nitrite',
  'nitrate',
  'gh',
  'kh',
  'phosphate',
  'tds',
  'iron',
  'potassium',
] as const satisfies readonly ParameterCode[]

export type PlateValue = { parameter: ParameterCode; value: number | null }

/**
 * The Parameters a plate shows, with their latest values, in the order above. They are the first three that were
 * measured in the tank, so a main Parameter that was never measured gives way to another one. If fewer than three
 * were measured, the main Parameters fill the empty places (with null, not zero) so every plate has three.
 */
export function plateValues(latest: Measurement[]): PlateValue[] {
  const valueOf = (parameter: ParameterCode) => latest.find((measurement) => measurement.parameter === parameter)?.value ?? null
  const measured = plateOrder.filter((parameter) => valueOf(parameter) !== null).slice(0, plateSlots)
  const fillers = plateOrder.filter((parameter) => !measured.includes(parameter)).slice(0, plateSlots - measured.length)
  return plateOrder
    .filter((parameter) => measured.includes(parameter) || fillers.includes(parameter))
    .map((parameter) => ({ parameter, value: valueOf(parameter) }))
}

/** True when the last row of a grid with this many columns is not full, so one more plate fits beside the others. */
export function hasRoomInLastRow(items: number, columns: number | null): boolean {
  return columns !== null && items % columns !== 0
}

/** A tank's plate number: its place in the list the API gives, which is by creation, counting from 1. */
export function plateNumber(tanks: readonly { id: string }[], id: string): number | null {
  const index = tanks.findIndex((tank) => tank.id === id)
  return index === -1 ? null : index + 1
}

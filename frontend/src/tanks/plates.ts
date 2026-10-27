import type { Measurement, ParameterCode } from './measurements'

/** The three Parameters every plate on the tank list shows, so tanks can be compared on the same values. */
export const plateParameters = ['ph', 'temperature', 'total_ammonia'] as const satisfies readonly ParameterCode[]

export type PlateValue = { parameter: (typeof plateParameters)[number]; value: number | null }

/** The latest value of each plate Parameter, in plate order. A Parameter never measured in the tank is null. */
export function plateValues(latest: Measurement[]): PlateValue[] {
  return plateParameters.map((parameter) => ({
    parameter,
    value: latest.find((measurement) => measurement.parameter === parameter)?.value ?? null,
  }))
}

/** A tank's plate number: its place in the list the API gives, which is by creation, counting from 1. */
export function plateNumber(tanks: readonly { id: string }[], id: string): number | null {
  const index = tanks.findIndex((tank) => tank.id === id)
  return index === -1 ? null : index + 1
}

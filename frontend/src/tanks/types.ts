/** What an owner writes about a Tank. Empty optional fields are null. Sizes are in cm, Net Volume in liters. */
export type TankDetails = {
  name: string
  startDate: string
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  netVolumeLiters: number | null
  note: string | null
}

/**
 * `archivedAt` is when the tank was archived, or null while it is running. `demo` marks the Demo Tank, and
 * `readOnly` is true when the reader does not own the tank (a visitor reading the Demo Tank).
 */
export type Tank = TankDetails & { id: string; archivedAt: string | null; demo: boolean; readOnly: boolean }

import type { Language } from '../i18n/language'
import { formatNumber } from './numbers'
import type { Tank } from './types'

/** The volume the calculations use, and where it comes from: the Net Volume the keeper gave, or the Gross Volume. */
export type Volume = { liters: number; kind: 'net' | 'gross' }

/** The Gross Volume in liters: length × width × height, in centimeters, over a thousand. Null until all three are known. */
export function grossLiters(lengthCm: number | null, widthCm: number | null, heightCm: number | null): number | null {
  if (lengthCm === null || widthCm === null || heightCm === null) return null
  if (!(lengthCm > 0 && widthCm > 0 && heightCm > 0)) return null
  return (lengthCm * widthCm * heightCm) / 1000
}

/**
 * The volume of a tank for the calculations (a water change in liters, for one): its Net Volume when it has one,
 * otherwise the Gross Volume worked out from its dimensions, otherwise nothing.
 */
export function volumeOf(tank: Pick<Tank, 'netVolumeLiters' | 'lengthCm' | 'widthCm' | 'heightCm'>): Volume | null {
  if (tank.netVolumeLiters !== null) return { liters: tank.netVolumeLiters, kind: 'net' }
  const gross = grossLiters(tank.lengthCm, tank.widthCm, tank.heightCm)
  return gross === null ? null : { liters: gross, kind: 'gross' }
}

/** A volume as the language writes it. A Gross Volume is a round figure; a Net Volume keeps what the keeper typed. */
export function formatVolume(volume: Volume, language: Language): string {
  return formatNumber(volume.liters, language, { maxDecimals: volume.kind === 'gross' ? 0 : 2 })
}

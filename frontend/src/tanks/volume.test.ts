import { describe, expect, it } from 'vitest'
import { formatVolume, grossLiters, volumeOf } from './volume'

const none = { netVolumeLiters: null, lengthCm: null, widthCm: null, heightCm: null }

describe('grossLiters', () => {
  it('multiplies the three dimensions and turns cubic centimeters into liters', () => {
    expect(grossLiters(120, 40, 50)).toBe(240)
    expect(grossLiters(80, 35, 45)).toBe(126)
  })

  it('is nothing until all three dimensions are known and above zero', () => {
    expect(grossLiters(120, 40, null)).toBeNull()
    expect(grossLiters(null, null, null)).toBeNull()
    expect(grossLiters(120, 0, 50)).toBeNull()
  })
})

describe('volumeOf', () => {
  it('uses the Net Volume when the keeper gave one, even with dimensions', () => {
    expect(volumeOf({ ...none, netVolumeLiters: 98.5, lengthCm: 120, widthCm: 40, heightCm: 50 })).toEqual({ liters: 98.5, kind: 'net' })
  })

  it('falls back to the Gross Volume from the dimensions', () => {
    expect(volumeOf({ ...none, lengthCm: 120, widthCm: 40, heightCm: 50 })).toEqual({ liters: 240, kind: 'gross' })
  })

  it('is nothing when there is neither', () => {
    expect(volumeOf(none)).toBeNull()
    expect(volumeOf({ ...none, lengthCm: 120, widthCm: 40 })).toBeNull()
  })
})

describe('formatVolume', () => {
  it('rounds a Gross Volume and keeps the decimals of a Net Volume', () => {
    expect(formatVolume({ liters: 126.4, kind: 'gross' }, 'en')).toBe('126')
    expect(formatVolume({ liters: 98.5, kind: 'net' }, 'pt-BR')).toBe('98,5')
  })
})

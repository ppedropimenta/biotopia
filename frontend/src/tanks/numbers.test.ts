import { describe, expect, it } from 'vitest'
import { formatNumber, parseNumber } from './numbers'

describe('parseNumber', () => {
  it('reads a decimal point in English and a decimal comma in Brazilian Portuguese', () => {
    expect(parseNumber('80.5', 'en')).toBe(80.5)
    expect(parseNumber('80,5', 'pt-BR')).toBe(80.5)
  })

  it('reads whole numbers and ignores the spaces around the number', () => {
    expect(parseNumber(' 120 ', 'en')).toBe(120)
    expect(parseNumber('120', 'pt-BR')).toBe(120)
  })

  it('treats an empty field as no value', () => {
    expect(parseNumber('', 'en')).toBeNull()
    expect(parseNumber('   ', 'pt-BR')).toBeNull()
  })

  it('refuses the other language’s separator instead of guessing, because 1.5 in Portuguese could be 15', () => {
    expect(parseNumber('80,5', 'en')).toBe('invalid')
    expect(parseNumber('80.5', 'pt-BR')).toBe('invalid')
  })

  it('refuses anything that is not a plain number', () => {
    expect(parseNumber('abc', 'en')).toBe('invalid')
    expect(parseNumber('1e3', 'en')).toBe('invalid')
    expect(parseNumber('-5', 'en')).toBe('invalid')
    expect(parseNumber('5.', 'en')).toBe('invalid')
    expect(parseNumber('1,000.5', 'en')).toBe('invalid')
  })
})

describe('formatNumber', () => {
  it('shows a decimal comma in Brazilian Portuguese and a point in English', () => {
    expect(formatNumber(80.5, 'pt-BR')).toBe('80,5')
    expect(formatNumber(80.5, 'en')).toBe('80.5')
  })

  it('drops needless decimals and keeps at most two', () => {
    expect(formatNumber(120, 'en')).toBe('120')
    expect(formatNumber(98.456, 'en')).toBe('98.46')
  })

  it('groups thousands for reading, in the language’s own way', () => {
    expect(formatNumber(1200, 'en')).toBe('1,200')
    expect(formatNumber(1200, 'pt-BR')).toBe('1.200')
  })

  it('can show more decimals, for readings a photometer gives to the thousandth', () => {
    expect(formatNumber(0.025, 'en', { maxDecimals: 4 })).toBe('0.025')
    expect(formatNumber(0.0051, 'pt-BR', { maxDecimals: 4 })).toBe('0,0051')
  })

  it('can leave the grouping out, for a field that is parsed back', () => {
    expect(formatNumber(1200.5, 'pt-BR', { grouping: false })).toBe('1200,5')
  })
})

import { describe, expect, it } from 'vitest'
import { formatNumber, parseNumber } from './numbers'

describe('parseNumber', () => {
  it('reads a decimal point in English and a decimal comma in Brazilian Portuguese', () => {
    expect(parseNumber('80.5')).toBe(80.5)
    expect(parseNumber('80,5')).toBe(80.5)
  })

  it('reads whole numbers and ignores the spaces around the number', () => {
    expect(parseNumber(' 120 ')).toBe(120)
    expect(parseNumber('120')).toBe(120)
  })

  it('treats an empty field as no value', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('   ')).toBeNull()
  })

  it('reads a point or a comma as the decimal separator in either language', () => {
    expect(parseNumber('80,5')).toBe(80.5)
    expect(parseNumber('80.5')).toBe(80.5)
    expect(parseNumber('0.025')).toBe(0.025)
  })

  it('has no thousands separator: one point or comma is always the decimal one, two are refused', () => {
    expect(parseNumber('1.500')).toBe(1.5)
    expect(parseNumber('1.000,5')).toBe('invalid')
    expect(parseNumber('1,000.5')).toBe('invalid')
  })

  it('refuses anything that is not a plain number', () => {
    expect(parseNumber('abc')).toBe('invalid')
    expect(parseNumber('1e3')).toBe('invalid')
    expect(parseNumber('-5')).toBe('invalid')
    expect(parseNumber('5.')).toBe('invalid')
    expect(parseNumber('1,000.5')).toBe('invalid')
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

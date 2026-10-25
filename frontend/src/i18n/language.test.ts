import { describe, expect, it } from 'vitest'
import { pickLanguage } from './language'

describe('pickLanguage', () => {
  it('keeps the language the visitor picked', () => {
    expect(pickLanguage('pt-BR', ['en-US'])).toBe('pt-BR')
  })

  it('ignores a stored value that is not a supported language', () => {
    expect(pickLanguage('de', ['pt-BR'])).toBe('pt-BR')
  })

  it('maps any Portuguese browser language to pt-BR', () => {
    expect(pickLanguage(null, ['pt-PT'])).toBe('pt-BR')
    expect(pickLanguage(null, ['pt'])).toBe('pt-BR')
  })

  it('uses the first browser language that is supported', () => {
    expect(pickLanguage(null, ['de-DE', 'pt-BR', 'en'])).toBe('pt-BR')
  })

  it('falls back to English', () => {
    expect(pickLanguage(null, ['de-DE', 'fr'])).toBe('en')
    expect(pickLanguage(null, [])).toBe('en')
  })
})

import type { Language } from '../i18n/language'

const decimalSeparator: Record<Language, string> = { en: '.', 'pt-BR': ',' }

/**
 * Reads what someone typed in a number field: null for an empty field, 'invalid' for anything else that is not
 * a plain non-negative number with the language's decimal separator. The other language's separator and
 * thousands separators are refused, not guessed: in Portuguese "1.5" could be meant as fifteen.
 */
export function parseNumber(text: string, language: Language): number | null | 'invalid' {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const separator = decimalSeparator[language]
  const plain = new RegExp(String.raw`^\d+([${separator}]\d+)?$`)
  if (!plain.test(trimmed)) return 'invalid'
  return Number(trimmed.replace(separator, '.'))
}

/** A number the way the language writes it, with at most two decimals (the API keeps no more). */
export function formatNumber(value: number, language: Language, { grouping = true } = {}): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 2, useGrouping: grouping }).format(value)
}

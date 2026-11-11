import type { Language } from '../i18n/language'

/**
 * Reads what someone typed in a number field: null for an empty field, 'invalid' for anything else that is not
 * a plain non-negative number. A point and a comma both mark the decimals, in either language, since phones and
 * habits mix them; so there is no thousands separator, and "1.500" is one and a half.
 */
export function parseNumber(text: string): number | null | 'invalid' {
  const trimmed = text.trim()
  if (trimmed === '') return null
  if (!/^\d+([.,]\d+)?$/.test(trimmed)) return 'invalid'
  return Number(trimmed.replace(',', '.'))
}

/** A number the way the language writes it, with at most two decimals unless `maxDecimals` says more. */
export function formatNumber(
  value: number,
  language: Language,
  { grouping = true, maxDecimals = 2 } = {},
): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: maxDecimals, useGrouping: grouping }).format(value)
}

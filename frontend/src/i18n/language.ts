export const languages = ['en', 'pt-BR'] as const
export type Language = (typeof languages)[number]

const fallback: Language = 'en'
const storageKey = 'language'

/**
 * A language the visitor picked wins; otherwise the first browser language we have, otherwise English.
 * Any Portuguese variant maps to pt-BR, the only Portuguese we have.
 */
export function pickLanguage(stored: string | null, browserLanguages: readonly string[]): Language {
  if (isLanguage(stored)) return stored
  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'pt') return 'pt-BR'
    if (base === 'en') return 'en'
  }
  return fallback
}

export function isLanguage(value: string | null): value is Language {
  return languages.includes(value as Language)
}

export function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

export function storeLanguage(language: Language) {
  try {
    localStorage.setItem(storageKey, language)
  } catch {
    // Private mode or blocked storage: the choice just lasts for this visit.
  }
}

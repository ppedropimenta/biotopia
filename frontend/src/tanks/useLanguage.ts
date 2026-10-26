import { useTranslation } from 'react-i18next'
import { isLanguage, type Language } from '../i18n/language'

/** The language the app is showing now, for formatting dates and numbers. */
export function useLanguage(): Language {
  const { i18n } = useTranslation()
  return isLanguage(i18n.language) ? i18n.language : 'en'
}

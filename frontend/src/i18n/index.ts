import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { ptBR } from './pt-BR'
import { pickLanguage, readStoredLanguage, storeLanguage, type Language } from './language'

const initial = pickLanguage(readStoredLanguage(), navigator.languages ?? [navigator.language])

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = initial

export function changeLanguage(language: Language) {
  storeLanguage(language)
  document.documentElement.lang = language
  return i18n.changeLanguage(language)
}

export default i18n

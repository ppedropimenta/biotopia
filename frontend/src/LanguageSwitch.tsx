import { useTranslation } from 'react-i18next'
import { useAuth } from './auth/context'
import { isLanguage, languages, type Language } from './i18n/language'

// Each language is named in itself, so a visitor who cannot read the current one still finds theirs.
const names: Record<Language, string> = {
  en: 'English',
  'pt-BR': 'Português',
}

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const { chooseLanguage } = useAuth()

  return (
    <label className="rise flex items-center gap-2">
      <span className="sr-only sm:not-sr-only sm:text-muted">{t('language.label')}</span>
      <select
        className="h-10 cursor-pointer bg-paper-deep px-2 transition-colors sm:px-3 hover:bg-ink hover:text-paper"
        value={i18n.language}
        onChange={(event) => {
          if (isLanguage(event.target.value)) void chooseLanguage(event.target.value)
        }}
      >
        {languages.map((language) => (
          <option key={language} value={language}>
            {names[language]}
          </option>
        ))}
      </select>
    </label>
  )
}

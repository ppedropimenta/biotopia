import { useTranslation } from 'react-i18next'
import { changeLanguage } from './i18n'
import { isLanguage, languages, type Language } from './i18n/language'

// Each language is named in itself, so a visitor who cannot read the current one still finds theirs.
const names: Record<Language, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
}

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()

  return (
    <label className="flex items-center gap-2 text-sm">
      {t('language.label')}
      <select
        className="border px-1 py-0.5"
        value={i18n.language}
        onChange={(event) => {
          if (isLanguage(event.target.value)) changeLanguage(event.target.value)
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

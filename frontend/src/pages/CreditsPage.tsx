import { useTranslation } from 'react-i18next'

export function CreditsPage() {
  const { t } = useTranslation()

  return (
    <>
      <h1 className="text-2xl font-semibold">{t('credits.title')}</h1>
      <p className="mt-2">{t('credits.empty')}</p>
    </>
  )
}

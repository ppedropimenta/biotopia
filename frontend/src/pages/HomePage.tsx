import { useTranslation } from 'react-i18next'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <>
      <h1 className="text-2xl font-semibold">{t('home.title')}</h1>
      <p className="mt-2">{t('home.status')}</p>
    </>
  )
}

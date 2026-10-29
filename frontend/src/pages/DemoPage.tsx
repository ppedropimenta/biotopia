import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { api } from '../auth/api'
import { LanguageToggle } from '../components/ui/Brand'
import { ButtonLink } from '../components/ui/Button'
import { useLoad } from '../tanks/useLoad'

/** /demo: goes to the Demo Tank's page, or says there is none. */
export function DemoPage() {
  const { t } = useTranslation()
  const demo = useLoad(() => api.demoTank(), 'demo')

  if (demo.status === 'loading') return null
  if (demo.status === 'ready' && demo.data) return <Navigate to={`/tanks/${demo.data.id}`} replace />
  return (
    <div className="mx-auto flex max-w-site flex-col items-start gap-5 px-6 py-24">
      <LanguageToggle tone="light" />
      <h1 className="m-0 text-display font-normal">{t('demo.none')}</h1>
      <ButtonLink to="/" variant="secondary">
        {t('ui.brand.name')}
      </ButtonLink>
    </div>
  )
}

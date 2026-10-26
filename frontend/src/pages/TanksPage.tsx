import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/context'

/** A placeholder until tanks exist (ticket 06): it proves the session works and shows who is logged in. */
export function TanksPage() {
  const { t } = useTranslation()
  const { state } = useAuth()

  return (
    <div className="px-5 pt-10 pb-40 sm:px-8 lg:pt-16">
      <h1 className="rise font-display text-[clamp(40px,8vw,128px)] leading-[0.95] tracking-[-0.02em]">
        {t('tanks.title')}
      </h1>
      {state.status === 'in' && <p className="rise mt-6 text-[15px] text-muted">{state.account.email}</p>}
      <p className="rise mt-8 max-w-[46ch] text-[18px] leading-relaxed">{t('tanks.empty')}</p>
    </div>
  )
}

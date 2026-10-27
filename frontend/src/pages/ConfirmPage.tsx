import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { api } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { ButtonLink } from '../components/ui/Button'

type Outcome = 'working' | 'done' | 'failed'

/**
 * Where the link in the confirmation email lands. The link works once, so the request must go out exactly
 * once even though React runs effects twice in development.
 */
export function ConfirmPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [outcome, setOutcome] = useState<Outcome>(token ? 'working' : 'failed')
  const sent = useRef(false)

  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true
    api
      .confirm(token)
      .then(() => setOutcome('done'))
      .catch(() => setOutcome('failed'))
  }, [token])

  const titles: Record<Outcome, string> = {
    working: t('auth.confirm.working'),
    done: t('auth.confirm.doneTitle'),
    failed: t('auth.confirm.failedTitle'),
  }

  return (
    <AuthScreen
      title={titles[outcome]}
      lead={outcome === 'done' ? t('auth.confirm.doneText') : outcome === 'failed' ? t('auth.confirm.failedText') : undefined}
    >
      {outcome !== 'working' && (
        <ButtonLink to="/login" size="lg" className="w-full">
          {t('nav.login')}
        </ButtonLink>
      )}
    </AuthScreen>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/Button'
import { api, ApiError } from './api'

/** Asks for the confirmation link again. The answer never says whether the address has an account. */
export function ResendLink({ email }: { email: string }) {
  const { t } = useTranslation()
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'limited'>('idle')

  async function resend() {
    setState('sending')
    try {
      await api.resendConfirmation(email)
      setState('sent')
    } catch (error) {
      setState(error instanceof ApiError && error.code === 'too_many_requests' ? 'limited' : 'failed')
    }
  }

  return (
    <div>
      <Button onClick={resend} disabled={state === 'sending'}>
        {t('auth.sent.resend')}
      </Button>
      <p role="status" className="mt-3 font-mono text-xs text-ink-muted">
        {state === 'sent' && t('auth.sent.resent')}
        {state === 'limited' && <span className="text-cardinal">{t('auth.errors.too_many_requests')}</span>}
        {state === 'failed' && <span className="text-cardinal">{t('auth.errors.generic')}</span>}
      </p>
    </div>
  )
}

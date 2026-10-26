import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from './api'
import { fieldButton } from './classes'

/** Asks for the confirmation link again. The answer never says whether the address has an account. */
export function ResendLink({ email }: { email: string }) {
  const { t } = useTranslation()
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  async function resend() {
    setState('sending')
    try {
      await api.resendConfirmation(email)
      setState('sent')
    } catch {
      setState('failed')
    }
  }

  return (
    <div>
      <button type="button" onClick={resend} disabled={state === 'sending'} className={fieldButton}>
        {t('auth.sent.resend')}
      </button>
      <p role="status" className="mt-3 text-[15px] text-on-tannin-muted">
        {state === 'sent' && t('auth.sent.resent')}
        {state === 'failed' && <span className="text-neon-red">{t('auth.errors.generic')}</span>}
      </p>
    </div>
  )
}

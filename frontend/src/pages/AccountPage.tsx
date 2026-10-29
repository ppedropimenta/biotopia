import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, api } from '../auth/api'
import { useAuth } from '../auth/context'
import { FormError } from '../auth/FormError'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/Field'
import { PageHeader, SectionHeader } from '../components/ui/Structure'

/** The account's own page. For now it holds one thing: deleting the account with everything in it. */
export function AccountPage() {
  const { t } = useTranslation()
  const { state, signedOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state.status !== 'in') return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.deleteAccount(password)
      // With no session the page is left for the log in screen.
      signedOut()
    } catch (failure) {
      const wrong = failure instanceof ApiError && failure.fields.password !== undefined
      setError(t(wrong ? 'account.wrongPassword' : 'account.generic'))
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title={t('account.title')} subtitle={t('account.lead', { email: state.account.email })} />
      <section className="flex max-w-[520px] flex-col gap-4">
        <SectionHeader title={t('account.deleteTitle')} level={3} />
        <p className="m-0 text-lead text-ink-soft">{t('account.deleteWhat')}</p>
        {confirming ? (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <TextField
              name="password"
              type="password"
              autoComplete="current-password"
              label={t('account.password')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <FormError>{error}</FormError>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="secondary" disabled={busy || password === ''}>
                {busy ? t('account.deleting') : t('account.delete')}
              </Button>
              <Button variant="dashed" disabled={busy} onClick={() => setConfirming(false)}>
                {t('tanks.lifecycle.confirmNo')}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <Button variant="dashed" onClick={() => setConfirming(true)}>
              {t('account.delete')}
            </Button>
          </div>
        )}
      </section>
    </>
  )
}

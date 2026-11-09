import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { ApiError, api } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { describeError, type FormErrors } from '../auth/errors'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { PasswordField } from '../components/ui/PasswordField'

type Outcome = 'asking' | 'done' | 'failed'

/** Where the link in the reset email lands: choose a new password, once. */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>(token ? 'asking' : 'failed')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setSubmitting(true)
    setErrors({})
    try {
      await api.resetPassword(token, password)
      setOutcome('done')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_link') setOutcome('failed')
      else setErrors(describeError(error, 'reset'))
    } finally {
      setSubmitting(false)
    }
  }

  if (outcome === 'done') {
    return (
      <AuthScreen title={t('auth.reset.doneTitle')} lead={t('auth.reset.doneText')}>
        <ButtonLink to="/login" size="lg" className="w-full">
          {t('nav.login')}
        </ButtonLink>
      </AuthScreen>
    )
  }

  if (outcome === 'failed') {
    return (
      <AuthScreen title={t('auth.reset.failedTitle')} lead={t('auth.reset.failedText')}>
        <ButtonLink to="/forgot-password" size="lg" className="w-full">
          {t('auth.reset.askAgain')}
        </ButtonLink>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title={t('auth.reset.title')} lead={t('auth.reset.lead')}>
      <form onSubmit={submit} noValidate aria-busy={submitting} className="flex flex-col gap-5.5">
        <PasswordField
          label={t('auth.password')}
          name="password"
          autoComplete="new-password"
          hint={t('auth.signup.passwordHint')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password && t(errors.password)}
        />
        {errors.general && <FormError>{t(errors.general)}</FormError>}
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? t('auth.working') : t('auth.reset.submit')}
        </Button>
      </form>
    </AuthScreen>
  )
}

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { api } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { useAuth } from '../auth/context'
import { describeError, type FormErrors } from '../auth/errors'
import { FormError } from '../auth/FormError'
import { Button, ButtonLink } from '../components/ui/Button'
import { TextField } from '../components/ui/Field'

/** Asks for a reset link. The answer is the same whether or not the address has an account. */
export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { state } = useAuth()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  if (state.status === 'in') return <Navigate to="/tanks" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await api.forgotPassword(email)
      setSentTo(email.trim())
    } catch (error) {
      setErrors(describeError(error, 'reset'))
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <AuthScreen title={t('auth.forgot.sentTitle')} lead={t('auth.forgot.sentText', { email: sentTo })}>
        <ButtonLink to="/login" size="lg" className="w-full">
          {t('nav.login')}
        </ButtonLink>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title={t('auth.forgot.title')} lead={t('auth.forgot.lead')}>
      <form onSubmit={submit} noValidate aria-busy={submitting} className="flex flex-col gap-5.5">
        <TextField
          label={t('auth.email')}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email && t(errors.email)}
        />
        {errors.general && <FormError>{t(errors.general)}</FormError>}
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? t('auth.working') : t('auth.forgot.submit')}
        </Button>
      </form>
      <p className="m-0 text-[0.9375rem]">
        <Link to="/login">{t('nav.login')}</Link>
      </p>
    </AuthScreen>
  )
}

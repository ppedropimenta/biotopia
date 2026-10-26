import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { ApiError } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { fieldButton, fieldLink } from '../auth/classes'
import { useAuth } from '../auth/context'
import { describeError, type FormErrors } from '../auth/errors'
import { Field } from '../auth/Field'
import { ResendLink } from '../auth/ResendLink'
import { pictures } from '../credits'

export function LogInPage() {
  const { t } = useTranslation()
  const { state, logIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Logging in flips the state, which also sends the person on to their tanks.
  if (state.status === 'in') return <Navigate to="/tanks" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setUnconfirmed(false)
    try {
      await logIn(email, password)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'email_not_confirmed') setUnconfirmed(true)
      else setErrors(describeError(error, 'login'))
      setSubmitting(false)
    }
  }

  return (
    <AuthScreen
      title={t('auth.login.title')}
      lead={t('auth.login.lead')}
      picture={pictures.cachoeira}
      pictureAlt={t('auth.login.photoAlt')}
      pictureCaption={t('auth.login.photoCaption')}
      pictureFocus="60% 50%"
    >
      <form onSubmit={submit} noValidate className="grid gap-6">
        <Field
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          label={t('auth.email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          label={t('auth.password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {errors.general && (
          <p role="alert" className="text-[15px] text-neon-red">
            {t(errors.general)}
          </p>
        )}
        <button type="submit" disabled={submitting} className={fieldButton}>
          {submitting ? t('auth.working') : t('auth.login.submit')}
        </button>
      </form>
      {unconfirmed && (
        <div className="mt-8 grid gap-4 bg-tannin-2 p-5">
          <p role="alert" className="text-[18px] leading-relaxed">
            {t('auth.login.unconfirmed')}
          </p>
          <ResendLink email={email.trim()} />
        </div>
      )}
      <p className="mt-8 text-[15px] text-on-tannin-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to="/signup" className={fieldLink}>
          {t('nav.signup')}
        </Link>
      </p>
    </AuthScreen>
  )
}

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { api } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { fieldButton, fieldLink } from '../auth/classes'
import { useAuth } from '../auth/context'
import { describeError, type FormErrors } from '../auth/errors'
import { Field } from '../auth/Field'
import { ResendLink } from '../auth/ResendLink'
import { pictures } from '../credits'
import { isLanguage } from '../i18n/language'

export function SignUpPage() {
  const { t, i18n } = useTranslation()
  const { state } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  // The address the link was sent to; set once the account exists.
  const [sentTo, setSentTo] = useState<string | null>(null)

  if (state.status === 'in') return <Navigate to="/tanks" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await api.signUp(email, password, isLanguage(i18n.language) ? i18n.language : 'en')
      setSentTo(email.trim())
    } catch (error) {
      setErrors(describeError(error, 'signup'))
    } finally {
      setSubmitting(false)
    }
  }

  const picture = {
    picture: pictures.neon,
    pictureAlt: t('auth.signup.photoAlt'),
    pictureCaption: t('auth.signup.photoCaption'),
    pictureFocus: '30% 50%',
  }

  if (sentTo) {
    return (
      <AuthScreen title={t('auth.sent.title')} lead={t('auth.sent.text', { email: sentTo })} {...picture}>
        <ResendLink email={sentTo} />
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title={t('auth.signup.title')} lead={t('auth.signup.lead')} {...picture}>
      {/* The server checks the fields, so every message is in the chosen language (not the browser's). */}
      <form onSubmit={submit} noValidate className="grid gap-6">
        <Field
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          label={t('auth.email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email && t(errors.email)}
        />
        <Field
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          label={t('auth.password')}
          hint={t('auth.signup.passwordHint')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password && t(errors.password)}
        />
        {errors.general && (
          <p role="alert" className="text-[15px] text-neon-red">
            {t(errors.general)}
          </p>
        )}
        <button type="submit" disabled={submitting} className={fieldButton}>
          {submitting ? t('auth.working') : t('auth.signup.submit')}
        </button>
      </form>
      <p className="mt-8 text-[15px] text-on-tannin-muted">
        {t('auth.signup.haveAccount')}{' '}
        <Link to="/login" className={fieldLink}>
          {t('nav.login')}
        </Link>
      </p>
    </AuthScreen>
  )
}

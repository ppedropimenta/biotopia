import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { api } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { fieldButton, fieldLink } from '../auth/classes'
import { useAuth } from '../auth/context'
import { describeError, type FormErrors } from '../auth/errors'
import { Field } from '../auth/Field'
import { pictures } from '../credits'

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

  const picture = {
    picture: pictures.igapo,
    pictureAlt: t('home.notes.igapoAlt'),
    pictureCaption: t('home.notes.igapoCaption'),
    pictureFocus: '50% 70%',
  }

  if (sentTo) {
    return (
      <AuthScreen title={t('auth.forgot.sentTitle')} lead={t('auth.forgot.sentText', { email: sentTo })} {...picture}>
        <Link to="/login" className={fieldButton}>
          {t('nav.login')}
        </Link>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title={t('auth.forgot.title')} lead={t('auth.forgot.lead')} {...picture}>
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
        {errors.general && (
          <p role="alert" className="text-[15px] text-neon-red">
            {t(errors.general)}
          </p>
        )}
        <button type="submit" disabled={submitting} className={fieldButton}>
          {submitting ? t('auth.working') : t('auth.forgot.submit')}
        </button>
      </form>
      <p className="mt-8 text-[15px]">
        <Link to="/login" className={fieldLink}>
          {t('nav.login')}
        </Link>
      </p>
    </AuthScreen>
  )
}

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { ApiError, api } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { fieldButton } from '../auth/classes'
import { describeError, type FormErrors } from '../auth/errors'
import { Field } from '../auth/Field'
import { pictures } from '../credits'

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

  const picture = {
    picture: pictures.igapo,
    pictureAlt: t('home.notes.igapoAlt'),
    pictureCaption: t('home.notes.igapoCaption'),
    pictureFocus: '50% 70%',
  }

  if (outcome === 'done') {
    return (
      <AuthScreen title={t('auth.reset.doneTitle')} lead={t('auth.reset.doneText')} {...picture}>
        <Link to="/login" className={fieldButton}>
          {t('nav.login')}
        </Link>
      </AuthScreen>
    )
  }

  if (outcome === 'failed') {
    return (
      <AuthScreen title={t('auth.reset.failedTitle')} lead={t('auth.reset.failedText')} {...picture}>
        <Link to="/forgot-password" className={fieldButton}>
          {t('auth.reset.askAgain')}
        </Link>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title={t('auth.reset.title')} lead={t('auth.reset.lead')} {...picture}>
      <form onSubmit={submit} noValidate className="grid gap-6">
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
          {submitting ? t('auth.working') : t('auth.reset.submit')}
        </button>
      </form>
    </AuthScreen>
  )
}

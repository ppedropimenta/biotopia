import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { ApiError, api } from '../auth/api'
import { AuthScreen } from '../auth/AuthScreen'
import { useAuth } from '../auth/context'
import { describeError, type FormErrors } from '../auth/errors'
import { FormError } from '../auth/FormError'
import { ResendLink } from '../auth/ResendLink'
import { Button, ButtonLink } from '../components/ui/Button'
import { TextField } from '../components/ui/Field'
import { plateClasses } from '../components/ui/plateClasses'
import { cx } from '../lib/cx'
import { isLanguage } from '../i18n/language'

export type Mode = 'login' | 'signup'

/**
 * Log in and sign up on one screen. Each has its own address (/login, /signup), so links in emails and
 * bookmarks keep working, and the switch is a pair of links that moves between them.
 */
export function SignInPage({ mode }: { mode: Mode }) {
  const { t } = useTranslation()
  const { state } = useAuth()
  // The address the confirmation link was sent to; set once sign up has worked.
  const [sentTo, setSentTo] = useState<string | null>(null)

  // Logging in flips the state, which also sends the person on to their tanks.
  if (state.status === 'in') return <Navigate to="/tanks" replace />

  if (sentTo) {
    return (
      <AuthScreen title={t('auth.sent.title')} lead={t('auth.sent.text', { email: sentTo })}>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
          <ResendLink email={sentTo} />
          <ButtonLink to="/login" variant="secondary">
            {t('auth.tabs.login')}
          </ButtonLink>
        </div>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title={mode === 'login' ? t('auth.login.title') : t('auth.signup.title')}
      switcher={<ModeSwitch mode={mode} />}
      note={t('auth.frame.privacy')}
    >
      {mode === 'login' ? <LogInForm /> : <SignUpForm onSignedUp={setSentTo} />}
    </AuthScreen>
  )
}

function ModeSwitch({ mode }: { mode: Mode }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('auth.tabs.label')} className="flex gap-4 sm:gap-5.5">
      {(['login', 'signup'] as const).map((m) => (
        <Link
          key={m}
          to={`/${m}`}
          aria-current={mode === m ? 'page' : undefined}
          className={cx(
            'flex min-h-11 items-center border-b-2 text-[1.5rem] whitespace-nowrap no-underline sm:text-[1.75rem]',
            mode === m ? 'border-ink text-ink hover:text-ink' : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          {t(`auth.tabs.${m}`)}
        </Link>
      ))}
    </nav>
  )
}

type FormProps = { onSignedUp: (email: string) => void }

function LogInForm() {
  const { t } = useTranslation()
  const { logIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    <>
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
        <div className="relative">
          <TextField
            label={t('auth.password')}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password && t(errors.password)}
          />
          <Link to="/forgot-password" className="absolute top-0 right-0 text-[0.9375rem]">
            {t('auth.login.forgot')}
          </Link>
        </div>
        {errors.general && <FormError>{t(errors.general)}</FormError>}
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? t('auth.working') : t('auth.login.submit')}
        </Button>
      </form>
      {unconfirmed && (
        <div className={cx(plateClasses('sm'), 'flex flex-col gap-4')}>
          <p role="alert" className="m-0 text-[1.1875rem] leading-relaxed">
            {t('auth.login.unconfirmed')}
          </p>
          <ResendLink email={email.trim()} />
        </div>
      )}
    </>
  )
}

function SignUpForm({ onSignedUp }: FormProps) {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await api.signUp(email, password, isLanguage(i18n.language) ? i18n.language : 'en')
      onSignedUp(email.trim())
    } catch (error) {
      setErrors(describeError(error, 'signup'))
      setSubmitting(false)
    }
  }

  // The server checks the fields, so every message is in the chosen language (not the browser's).
  return (
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
      <TextField
        label={t('auth.password')}
        name="password"
        type="password"
        autoComplete="new-password"
        hint={t('auth.signup.passwordHint')}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password && t(errors.password)}
      />
      {errors.general && <FormError>{t(errors.general)}</FormError>}
      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? t('auth.working') : t('auth.signup.submit')}
      </Button>
    </form>
  )
}

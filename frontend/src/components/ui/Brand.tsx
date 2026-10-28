import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context'
import { languages, type Language } from '../../i18n/language'
import { cx } from '../../lib/cx'
import { findArt } from '../../lib/illustrations'

/**
 * "Biotopia" in Fraunces italic and the tagline in mono ("Aquarium logbook"). Always on blackwater. The name and
 * the tagline are set only here and in the translations (ui.brand).
 */
export function Wordmark({
  to = '/',
  stacked = false,
  size = 'md',
  className,
}: {
  to?: string
  stacked?: boolean
  size?: 'md' | 'lg'
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Link
      to={to}
      className={cx(
        'flex min-h-11 text-river-bright no-underline hover:text-river-bright',
        stacked ? 'flex-col justify-center gap-0.5' : 'items-center gap-2.5',
        className,
      )}
    >
      <span className={cx('font-serif leading-none font-semibold italic', size === 'md' ? 'text-[1.75rem]' : 'text-[1.875rem]')}>
        {t('ui.brand.name')}
      </span>
      <span className="sr-only"> · </span>
      <span className="font-mono text-[0.65625rem] tracking-[0.16em] text-amber-soft uppercase">{t('ui.brand.tagline')}</span>
    </Link>
  )
}

const short: Record<Language, string> = { 'pt-BR': 'PT', en: 'EN' }
const long: Record<Language, string> = { 'pt-BR': 'Português', en: 'English' }

/**
 * PT | EN. Shows which language is on with aria-pressed. The choice goes through the account, so a logged-in
 * keeper keeps it on every device. `tone="dark"` for the menu and the dark header, "light" on paper.
 */
export function LanguageToggle({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  const { t, i18n } = useTranslation()
  const { chooseLanguage } = useAuth()
  return (
    <div
      role="group"
      aria-label={t('ui.language.label')}
      className={cx('flex rounded-paper font-mono text-[0.71875rem]', tone === 'dark' ? 'border border-river-muted' : 'border border-ink', className)}
    >
      {[...languages].reverse().map((language) => {
        const on = language === i18n.language
        return (
          <button
            key={language}
            type="button"
            lang={language}
            aria-pressed={on}
            title={long[language]}
            onClick={() => void chooseLanguage(language)}
            className={cx(
              'min-h-11 min-w-11 cursor-pointer px-2',
              tone === 'dark' && (on ? 'bg-river-text text-blackwater' : 'bg-transparent text-river-text'),
              tone === 'light' && (on ? 'bg-ink text-paper-card' : 'bg-transparent text-ink'),
            )}
          >
            {short[language]}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A drawing by its slug (lib/illustrations.ts). With no drawing for the slug it shows a plain fish outline.
 * `decorative` hides it from screen readers; a drawing of a species takes its scientific name as `alt`.
 */
export function Illustration({
  slug,
  alt = '',
  decorative = false,
  className,
  fit = 'width',
  eager = false,
}: {
  slug: string
  alt?: string
  decorative?: boolean
  className?: string
  /** "width": 100% wide and as tall as it needs; "contain": fits the box of its parent. */
  fit?: 'width' | 'contain'
  /** For a drawing that is on screen at first paint; the others load when they get near. */
  eager?: boolean
}) {
  const art = findArt(slug)
  if (!art) return <FishPlaceholder className={className} />
  return (
    <img
      src={art.src}
      width={art.width}
      height={art.height}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      loading={eager ? 'eager' : 'lazy'}
      className={cx(fit === 'width' ? 'block h-auto w-full' : 'block max-h-full max-w-full object-contain', className)}
    />
  )
}

/** An outline of a fish, for a species with no drawing yet. */
export function FishPlaceholder({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 50" className={cx('block h-auto w-full text-ink-muted', className)}>
      <path
        d="M8 25c14-14 46-18 66-6l18-11v34L74 31C54 43 22 39 8 25z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <circle cx="22" cy="23" r="2.5" fill="currentColor" />
    </svg>
  )
}

/** A scientific name: always italic and marked as Latin. */
export function Binomial({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <i lang="la" className={className}>
      {children}
    </i>
  )
}

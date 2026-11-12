import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context'
import { languages, type Language } from '../../i18n/language'
import { cx } from '../../lib/cx'
import { findArt } from '../../lib/illustrations'

/**
 * The leaffish symbol, drawn in the current colour. This is the cut for dark backgrounds (slightly wider veins);
 * the full logo kit, with the other cuts, lives outside the repo.
 */
export function BrandSymbol({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="14 72 228 116" className={cx('block h-auto shrink-0 fill-current', className)}>
      <path
        fillRule="evenodd"
        d="M16.68 155.95C40.31 89.58 125.17 58.55 193.63 105.43L208.12 101.55C214.75 91.49 220.66 82.66 227.35 76.73C225.18 91.8 229.32 107.26 238.74 119.23C229.98 117.43 220.44 112.74 209.68 107.35L195.19 111.23C159.33 186.06 70.33 201.62 16.68 155.95ZM66.39 140.56 187.68 106.41 189.55 113.36 67.43 144.43ZM110.49 123.57 79.88 105.89 84.17 99.88 120.54 120.88ZM158.79 110.63 129.4 93.66 134.58 87.5 169.61 107.73ZM114.12 137.09 96.44 167.71 103.16 170.77 124.16 134.4ZM162.41 124.15 145.44 153.54 153.01 156.28 173.23 121.25ZM37.54 144.15C36.28 139.46 39.06 134.63 43.76 133.37 48.45 132.12 53.28 134.9 54.54 139.6 55.79 144.29 53.01 149.12 48.31 150.37 43.62 151.63 38.79 148.85 37.54 144.15Z"
      />
    </svg>
  )
}

/**
 * The leaffish symbol, "Biotopia" in Source Serif 4 italic and the tagline in mono ("Aquarium logbook"). Always on
 * blackwater. The name and the tagline are set only here and in the translations (ui.brand). The tagline shows
 * only with `tagline` (the side menu).
 */
export function Wordmark({
  to = '/',
  stacked = false,
  size = 'md',
  tagline = false,
  className,
}: {
  to?: string
  stacked?: boolean
  size?: 'md' | 'lg'
  tagline?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Link
      to={to}
      className={cx('flex min-h-11 items-center gap-2.5 text-river-bright no-underline hover:text-river-bright', !stacked && 'py-2', className)}
    >
      <BrandSymbol className={cx('text-amber', size === 'md' ? 'w-11' : 'w-12')} />
      <span className={cx('flex', stacked ? 'flex-col justify-center gap-0.5' : 'flex-wrap items-baseline gap-x-2.5')}>
        <span className={cx('font-serif leading-none font-semibold italic', size === 'md' ? 'text-h3' : 'text-h2')}>
          {t('ui.brand.name')}
        </span>
        {tagline && (
          <>
            <span className="sr-only"> · </span>
            <span className="font-mono text-caption tracking-[0.16em] text-amber-soft uppercase">{t('ui.brand.tagline')}</span>
          </>
        )}
      </span>
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
      className={cx('flex rounded-paper font-mono text-caption', tone === 'dark' ? 'border border-river-muted' : 'border border-ink', className)}
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

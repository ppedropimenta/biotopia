import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LanguageToggle, Wordmark } from '../ui/Brand'
import { buttonClasses } from '../ui/buttonClasses'

/**
 * The bar of the public pages on blackwater: the brand, PT / EN and Log in. For a keeper who is logged in
 * (`signedIn`) the last button is "My tanks" instead.
 */
export function PublicHeader({
  links = [],
  logInTo = '/login',
  signedIn = false,
}: {
  links?: ReadonlyArray<{ to: string; label: string }>
  logInTo?: string
  signedIn?: boolean
}) {
  const { t } = useTranslation()
  return (
    <header className="relative overflow-hidden texture-river-wide text-river-bright">
      <nav aria-label={t('ui.nav.label')} className="relative mx-auto flex max-w-site flex-wrap items-center gap-x-7 gap-y-4 px-6 py-4.5">
        <Wordmark size="lg" />
        <div className="flex-auto" />
        <div className="flex flex-wrap items-center gap-5.5 font-mono text-[0.8125rem] tracking-[0.04em]">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="inline-flex min-h-11 items-center text-river-bright no-underline hover:text-amber">
              {link.label}
            </Link>
          ))}
          <LanguageToggle tone="dark" />
          <Link to={signedIn ? '/tanks' : logInTo} className={buttonClasses('onDark')}>
            {t(signedIn ? 'ui.nav.myTanks' : 'ui.nav.logIn')}
          </Link>
        </div>
      </nav>
    </header>
  )
}

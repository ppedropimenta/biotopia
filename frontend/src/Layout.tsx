import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth/context'
import { AppShell, LogMeasurementCta, SideNav, SkipLink } from './components/layout/AppShell'
import { DemoBanner } from './components/layout/DemoBanner'
import { demoNavGroups, navGroups } from './components/layout/navGroups'
import { PublicHeader } from './components/layout/PublicHeader'
import { ButtonLink } from './components/ui/Button'
import { cx } from './lib/cx'
import { useCurrentTank } from './tanks/useCurrentTank'

/** The links under the side menu. */
const footerLink = 'inline-flex min-h-11 items-center text-river-text hover:text-river-bright'

/**
 * The frame of every page: the app shell for a keeper who is logged in, the public header for anyone else. The
 * landing page is the exception: it is a page to read, so a keeper gets it in the public frame, with My tanks in
 * the header.
 */
export function Layout() {
  const { t } = useTranslation()
  const { state, logOut } = useAuth()
  const tank = useCurrentTank()
  const onLanding = useLocation().pathname === '/'

  // While the session is being checked neither frame is known, so show the blackwater and nothing else.
  if (state.status === 'loading') return <div className="min-h-svh texture-river" />

  if (state.status === 'in' && !onLanding) {
    return (
      <AppShell
        nav={
          <SideNav
            groups={navGroups(t, tank)}
            cta={<LogMeasurementCta to={tank ? `/tanks/${tank.id}/measure` : '/tanks'} />}
            footer={
              <>
                <Link to="/account" className={footerLink}>
                  {t('ui.nav.account')}
                </Link>
                <Link to="/credits" className={footerLink}>
                  {t('ui.nav.credits')}
                </Link>
                <button
                  type="button"
                  onClick={logOut}
                  className={cx(footerLink, 'cursor-pointer self-start bg-transparent p-0 font-mono text-sm')}
                >
                  {t('ui.nav.logOut')}
                </button>
              </>
            }
          />
        }
      >
        {tank?.readOnly && <DemoBanner to="/tanks/new" />}
        <Outlet />
      </AppShell>
    )
  }

  // A visitor reading the Demo Tank gets its own menu and the banner; any other tank page sends them to log in.
  if (tank?.readOnly) {
    return (
      <AppShell
        nav={
          <SideNav
            groups={demoNavGroups(t, tank)}
            cta={
              <ButtonLink to="/signup" variant="amber" className="w-full">
                {t('ui.nav.createNotebook')}
              </ButtonLink>
            }
            footer={
              <>
                <Link to="/login" className={footerLink}>
                  {t('ui.nav.logIn')}
                </Link>
                <Link to="/credits" className={footerLink}>
                  {t('ui.nav.credits')}
                </Link>
              </>
            }
          />
        }
      >
        <DemoBanner to="/signup" />
        <Outlet />
      </AppShell>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <PublicHeader links={[{ to: '/demo', label: t('home.navDemo') }]} signedIn={state.status === 'in'} />
      <main id="content" tabIndex={-1} className="flex-1 texture-paper font-serif text-ink">
        <Outlet />
      </main>
      <footer className="texture-river-wide text-river-text">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-10 gap-y-5 px-6 py-11">
          <span className="text-h3 font-semibold text-river-bright italic">{t('ui.brand.name')}</span>
          <span className="font-mono text-label text-river-caption">{t('footer.made')}</span>
          <Link to="/credits" className="inline-flex min-h-11 items-center font-mono text-sm text-river-bright">
            {t('footer.credits')}
          </Link>
        </div>
      </footer>
    </div>
  )
}

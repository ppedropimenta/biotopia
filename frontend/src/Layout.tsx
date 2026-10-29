import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { useAuth } from './auth/context'
import { AppShell, LogMeasurementCta, SideNav, SkipLink } from './components/layout/AppShell'
import { navGroups } from './components/layout/navGroups'
import { PublicHeader } from './components/layout/PublicHeader'
import { Button } from './components/ui/Button'
import { useCurrentTank } from './tanks/useCurrentTank'

/** The frame of every page: the app shell for a keeper who is logged in, the public header for anyone else. */
export function Layout() {
  const { t } = useTranslation()
  const { state, logOut } = useAuth()
  const tank = useCurrentTank()

  // While the session is being checked neither frame is known, so show the blackwater and nothing else.
  if (state.status === 'loading') return <div className="min-h-svh texture-river" />

  if (state.status === 'in') {
    return (
      <AppShell
        nav={
          <SideNav
            groups={navGroups(t, tank)}
            cta={<LogMeasurementCta to={tank ? `/tanks/${tank.id}/measure` : '/tanks'} />}
            footer={
              <>
                <p className="m-0 text-[0.78125rem] break-all text-river-caption">{state.account.email}</p>
                <Link to="/account" className="inline-flex min-h-11 items-center text-river-text hover:text-river-bright">
                  {t('ui.nav.account')}
                </Link>
                <Link to="/credits" className="inline-flex min-h-11 items-center text-river-text hover:text-river-bright">
                  {t('ui.nav.credits')}
                </Link>
                <Button variant="onDark" onClick={logOut} className="self-start">
                  {t('ui.nav.logOut')}
                </Button>
              </>
            }
          />
        }
      >
        <Outlet />
      </AppShell>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <PublicHeader />
      <main id="content" tabIndex={-1} className="flex-1 texture-paper font-serif text-ink">
        <Outlet />
      </main>
      <footer className="texture-river-wide text-river-text">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-10 gap-y-5 px-6 py-11">
          <span className="text-[1.625rem] font-semibold text-river-bright italic">{t('ui.brand.name')}</span>
          <span className="font-mono text-[0.78125rem] text-river-caption">{t('footer.made')}</span>
          <Link to="/credits" className="inline-flex min-h-11 items-center font-mono text-[0.8125rem] text-river-bright">
            {t('footer.credits')}
          </Link>
        </div>
      </footer>
    </div>
  )
}

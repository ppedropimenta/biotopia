import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { useAuth } from './auth/context'
import { AppShell, LogMeasurementCta, SideNav, SkipLink } from './components/layout/AppShell'
import { navGroups } from './components/layout/navGroups'
import { PublicHeader } from './components/layout/PublicHeader'
import { Button } from './components/ui/Button'
import { useCurrentTank } from './tanks/useCurrentTank'

// Read once at load; the footer does not need to roll over at midnight.
const year = new Date().getFullYear()

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
            cta={tank && <LogMeasurementCta to={`/tanks/${tank.id}/measure`} />}
            footer={
              <>
                <p className="m-0 text-[0.78125rem] break-all text-river-caption">{state.account.email}</p>
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
      <footer className="bg-tannin px-5 pt-16 pb-8 text-on-tannin sm:px-8">
        <p aria-hidden="true" className="font-display text-[22vw] leading-[0.8] tracking-[-0.03em] italic sm:text-[17vw]">
          {t('ui.brand.name')}
        </p>
        <div className="mt-10 grid gap-2 text-[15px] sm:grid-cols-[1fr_auto_1fr] sm:items-baseline">
          <p className="text-on-tannin-muted">{t('footer.about')}</p>
          <Link to="/credits" className="text-on-tannin underline-offset-4 hover:text-neon-glow hover:underline">
            {t('footer.credits')}
          </Link>
          <p className="text-on-tannin-muted sm:text-right">© {year}</p>
        </div>
      </footer>
    </div>
  )
}

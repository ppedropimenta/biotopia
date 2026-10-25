import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { LanguageSwitch } from './LanguageSwitch'

// Deliberately plain: the visual direction is decided in its own step.
export function Layout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center gap-4 border-b px-4 py-3">
        <Link to="/" className="font-semibold">
          {t('app.name')}
        </Link>
        <nav className="flex gap-3">
          <NavLink to="/">{t('nav.home')}</NavLink>
          <NavLink to="/credits">{t('nav.credits')}</NavLink>
        </nav>
        <div className="ml-auto">
          <LanguageSwitch />
        </div>
      </header>
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t px-4 py-3 text-sm">
        <Link to="/credits">{t('footer.credits')}</Link>
      </footer>
    </div>
  )
}

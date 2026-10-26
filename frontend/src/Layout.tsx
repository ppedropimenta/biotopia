import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { LanguageSwitch } from './LanguageSwitch'
import { Mark } from './Mark'

// Read once at load; the footer does not need to roll over at midnight.
const year = new Date().getFullYear()

export function Layout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-6 px-5 py-5 sm:px-8">
        <Link to="/" className="rise flex items-center gap-3">
          <Mark className="size-8" />
          <span className="font-display text-[30px] leading-none italic">{t('app.name')}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-6 text-[15px]">
          <NavLink
            to="/credits"
            className={({ isActive }) =>
              // The footer carries the same link, so a phone keeps the bar to the name and the language.
              `rise hidden underline-offset-4 hover:underline sm:inline ${isActive ? 'underline' : ''}`
            }
          >
            {t('nav.credits')}
          </NavLink>
          <LanguageSwitch />
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-tannin px-5 pt-16 pb-8 text-on-tannin sm:px-8">
        <p aria-hidden="true" className="font-display text-[22vw] leading-[0.8] tracking-[-0.03em] italic sm:text-[17vw]">
          {t('app.name')}
        </p>
        <div className="mt-10 grid gap-2 text-[15px] sm:grid-cols-[1fr_auto_1fr] sm:items-baseline">
          <p className="text-on-tannin-muted">{t('footer.about')}</p>
          <Link to="/credits" className="underline-offset-4 hover:text-neon hover:underline">
            {t('footer.credits')}
          </Link>
          <p className="text-on-tannin-muted sm:text-right">© {year}</p>
        </div>
      </footer>
    </div>
  )
}

import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { cx } from '../../lib/cx'
import { Wordmark } from '../ui/Brand'
import { ButtonLink } from '../ui/Button'
import { Icon, type IconName } from '../ui/Icon'

export type NavItem = {
  to: string
  label: string
  icon: IconName
  /** NavLink `end`: active only on the exact route. */
  end?: boolean
}

export type NavGroup = {
  /** The group label in mono (the name of the tank). */
  label?: string
  items: NavItem[]
}

/**
 * The side menu on blackwater. The active item is a paper tab leaning on the content. Below `md` it becomes
 * a bar fixed at the top with a Menu button, so the menu and the record buttons stay in reach on a long page; an
 * open menu taller than the screen scrolls inside the bar. From `md` up it is always open.
 */
export function SideNav({ groups, cta, footer }: { groups: NavGroup[]; cta?: ReactNode; footer?: ReactNode }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const listId = useId()
  return (
    <nav
      aria-label={t('ui.nav.label')}
      data-app-nav
      className="flex max-w-full flex-[1_1_var(--spacing-nav)] flex-col gap-4 texture-river max-md:bg-size-[max(520px,100%)_auto] max-md:bg-position-[right_0_top_-80px] py-4 pr-0 pl-4.5 font-mono text-sm text-river-text md:gap-6.5 md:py-6.5 max-md:sticky max-md:top-0 max-md:z-20 max-md:max-h-svh max-md:overflow-y-auto min-[808px]:sticky min-[808px]:top-0 min-[808px]:h-svh min-[808px]:self-start min-[808px]:overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-3 pr-4.5 md:pr-0">
        <Wordmark stacked className="pl-2" />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 cursor-pointer items-center gap-2 border border-river-muted/60 px-3 text-button text-river-text md:hidden"
        >
          <Icon name={open ? 'close' : 'menu'} size={18} strokeWidth={1.8} />
          {t('ui.nav.menu')}
        </button>
      </div>
      {cta && <div className="pr-4.5">{cta}</div>}
      <div id={listId} className={cx('flex-1 flex-col gap-6.5 md:flex', open ? 'flex' : 'hidden')}>
        <div className="flex flex-col gap-0.5">
          {groups.map((group, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {group.label && (
                <p className="mt-4.5 mb-1.5 ml-3.5 text-caption tracking-[0.18em] break-words text-river-muted uppercase">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cx(
                      'flex min-h-11 items-center gap-3 px-3.5 no-underline',
                      isActive
                        ? 'rounded-l-[3px] bg-paper text-ink hover:text-ink'
                        : 'text-river-text hover:bg-blackwater-raised hover:text-river-bright',
                    )
                  }
                >
                  <Icon name={item.icon} size={19} strokeWidth={1.6} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3 pr-4.5">
          {footer}
        </div>
      </div>
    </nav>
  )
}

/** The link that jumps over the menu to the content. */
export function SkipLink() {
  const { t } = useTranslation()
  return (
    <a
      href="#content"
      className="sr-only z-10 bg-amber px-4 py-2 font-mono text-blackwater focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
    >
      {t('ui.skip')}
    </a>
  )
}

/** The frame of the logged-in screens: a skip link, the side menu and the content with a widest width. */
export function AppShell({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap texture-paper font-serif text-ink">
      <SkipLink />
      {nav}
      <main id="content" tabIndex={-1} className="min-w-0 flex-[999_1_560px] px-[clamp(20px,4vw,56px)] pt-7.5 pb-16">
        <div className="mx-auto flex max-w-page flex-col gap-9">{children}</div>
      </main>
    </div>
  )
}

/** The amber "Log measurement" button at the top of the menu. */
export function LogMeasurementCta({ to }: { to: string }) {
  const { t } = useTranslation()
  return (
    <ButtonLink to={to} variant="amber" icon="plus" className="w-full max-md:px-2.5" aria-label={t('ui.nav.logMeasurement')}>
      {t('ui.nav.measurement')}
    </ButtonLink>
  )
}

/** The quieter "Log maintenance" button under it, for the screens of one tank. */
export function LogMaintenanceCta({ to }: { to: string }) {
  const { t } = useTranslation()
  return (
    <ButtonLink to={to} variant="onDark" icon="plus" className="w-full max-md:px-2.5" aria-label={t('ui.nav.logMaintenance')}>
      {t('maintenance.record')}
    </ButtonLink>
  )
}

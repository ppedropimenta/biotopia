import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SkipLink } from '../components/layout/AppShell'
import { Binomial, Illustration, LanguageToggle, Wordmark } from '../components/ui/Brand'
import { PlateCorners } from '../components/ui/Plate'
import { plateClasses } from '../components/ui/plateClasses'
import { Handwritten } from '../components/ui/Paper'
import { cx } from '../lib/cx'

type Props = {
  title: string
  lead?: string
  /**
   * What stands in for the visible title: the log in / sign up switch. The title then stays in the page for
   * screen readers (every screen has one h1).
   */
  switcher?: ReactNode
  /** A short handwritten note under the content. */
  note?: string
  children?: ReactNode
}

/**
 * The frame of every account screen, from the kit's sign-in: a blackwater panel with a plate of a Victoria
 * amazonica on the left, the form on paper on the right. On a phone the plate gives way to a dark strip with
 * the brand, so the form comes first.
 */
export function AuthScreen({ title, lead, switcher, note, children }: Props) {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] texture-paper font-serif text-ink lg:grid-cols-2 lg:grid-rows-1">
      <SkipLink />
      <div className="texture-river px-6 py-2 lg:hidden">
        <Wordmark />
      </div>

      <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden texture-river px-12 pt-8 pb-10 text-river-bright lg:flex">
        <Wordmark size="lg" />
        <figure
          className={cx(
            plateClasses('md'),
            'mx-auto my-0 w-full max-w-[520px] -rotate-[1.2deg] shadow-[inset_0_0_0_5px_var(--color-paper-card),inset_0_0_0_6px_rgb(36_26_17/0.5),var(--shadow-float)]',
          )}
        >
          <PlateCorners items={[`${t('ui.plate.plate')} IV`, t('auth.frame.habitat'), `${t('ui.plate.fig')} 7`]} />
          <Illustration slug="victoria-amazonica" decorative className="mt-2.5 mb-1" />
          <figcaption className="flex flex-col border-t border-ink/40 pt-2.5">
            <span className="text-lead">
              <Binomial>Victoria amazonica</Binomial>
            </span>
          </figcaption>
        </figure>
        <p className="m-0 max-w-[36ch] text-lead leading-[1.4] text-river-text">
          {t('auth.frame.tagline')} <em className="text-amber">{t('auth.frame.taglineEmphasis')}</em>
        </p>
      </aside>

      <main id="content" tabIndex={-1} className="flex flex-col justify-center px-[clamp(24px,6vw,96px)] py-12">
        <div className="mx-auto flex w-full max-w-[440px] flex-col gap-7">
          <div className="flex items-start justify-between gap-4">
            {switcher ? (
              <>
                <h1 className="sr-only">{title}</h1>
                {switcher}
              </>
            ) : (
              <h1 className="m-0 text-h2 leading-tight font-normal">{title}</h1>
            )}
            <LanguageToggle tone="light" className="flex-none" />
          </div>
          {lead && <p className="m-0 -mt-3 text-lead text-ink-soft">{lead}</p>}
          {children}
          {note && (
            <Handwritten as="p" className="m-0">
              {note}
            </Handwritten>
          )}
        </div>
      </main>
    </div>
  )
}

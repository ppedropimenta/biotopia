import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SkipLink } from '../components/layout/AppShell'
import { Binomial, Illustration, Wordmark } from '../components/ui/Brand'
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

      <aside className="relative isolate hidden flex-col justify-between gap-8 overflow-hidden bg-blackwater px-12 pt-8 pb-10 text-river-bright lg:flex">
        {/* The roots grow from the right edge of the texture, so it is mirrored to make them come in from the left. */}
        <div
          aria-hidden
          className="texture-river absolute inset-0 -z-10 -scale-x-100 bg-size-[100%_auto] bg-position-[left_top]"
        />
        <Wordmark size="lg" />
        <div className="mx-auto my-auto flex w-full max-w-[clamp(400px,40vw,640px)] flex-col gap-8">
          <figure
            className={cx(
              plateClasses('md'),
              'm-0 w-full -rotate-[1.2deg] shadow-[inset_0_0_0_5px_var(--color-paper-card),inset_0_0_0_6px_rgb(36_26_17/0.5),var(--shadow-float)]',
            )}
          >
            <PlateCorners items={[`${t('ui.plate.plate')} IV`, t('auth.frame.habitat'), `${t('ui.plate.fig')} 7`]} />
            <Illustration slug="victoria-amazonica" decorative className="mt-2.5 mb-1" />
            <figcaption className="flex flex-col border-t border-ink/40 pt-2.5">
              <span className="text-lead">
                <Binomial>Victoria amazonica</Binomial>
              </span>
              <span className="font-mono text-xs text-ink-muted">{t('auth.frame.plateCaption')}</span>
            </figcaption>
          </figure>
          {/* A patch of the panel colour behind the line, soft at the edges, so the roots do not cross the letters. */}
          <p className="relative m-0 text-lead leading-[1.4] text-balance text-river-text before:absolute before:-inset-x-6 before:-top-10 before:-bottom-7 before:-z-10 before:bg-blackwater before:blur-md">
            {t('auth.frame.tagline')}
          </p>
        </div>
      </aside>

      <main id="content" tabIndex={-1} className="flex flex-col justify-center px-[clamp(24px,6vw,96px)] py-12">
        <div className="mx-auto flex w-full max-w-[440px] flex-col gap-7">
          <div className="flex items-start">
            {switcher ? (
              <>
                <h1 className="sr-only">{title}</h1>
                {switcher}
              </>
            ) : (
              <h1 className="m-0 text-h2 leading-tight font-normal">{title}</h1>
            )}
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

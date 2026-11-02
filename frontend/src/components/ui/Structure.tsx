import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'

/** A section title with an ink rule under it and an action on the right (a "See all →" link). */
export function SectionHeader({
  title,
  level = 2,
  aside,
  size = 'md',
  className,
}: {
  title: ReactNode
  level?: 2 | 3
  aside?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <div className={cx('flex flex-wrap items-baseline justify-between gap-2.5 border-b-[1.5px] border-ink pb-2', className)}>
      <Heading className={cx('m-0 font-normal', size === 'md' ? 'text-h2' : 'text-h3')}>{title}</Heading>
      {aside && <div className="font-mono text-label">{aside}</div>}
    </div>
  )
}

/** The head of a page in the app: an optional trail, the H1, a subtitle and the actions. */
export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
}: {
  breadcrumbs?: ReadonlyArray<{ label: ReactNode; to?: string }>
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-ink pb-3.5">
      <div className="flex flex-col gap-1.5">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <h1 className="m-0 text-h1 font-normal tracking-[-0.015em]">{title}</h1>
        {subtitle && <p className="m-0 text-lead text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  )
}

export function Breadcrumbs({ items }: { items: ReadonlyArray<{ label: ReactNode; to?: string }> }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('ui.breadcrumb')} className="font-mono text-label text-ink-muted">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.to ? (
              <Link to={item.to} className="inline-flex min-h-11 items-center text-ink-muted">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

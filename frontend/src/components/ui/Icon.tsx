import type { ReactNode } from 'react'

/**
 * Stroke icons (24×24, stroke = currentColor), so they follow the text colour. Without a `title` they are
 * decorative (aria-hidden). On an icon-only button, give the button an `aria-label`.
 */
const PATHS = {
  tank: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <path d="M3 10.5c3-1.5 6 1.5 9 0s6-1.5 9 0" />
    </>
  ),
  gauge: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12l4-3" />
    </>
  ),
  timeline: <path d="M3 19h18M5 15l4-5 4 3 6-7" />,
  bucket: (
    <>
      <path d="M5 8h14l-1.5 11h-11z" />
      <path d="M8.5 8a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <circle cx="12" cy="13.5" r="3.5" />
      <path d="M8 7l1.5-3h5L16 7" />
    </>
  ),
  fish: <path d="M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2z" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  river: (
    <>
      <path d="M3 5c5 2 3 7 8 9s5 4 10 5" />
      <path d="M13 4c1 3 4 4 8 4" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  cube: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l5 5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3l9 17H3z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  undo: (
    <>
      <path d="M9 7L4 12l5 5" />
      <path d="M4 12h10a6 6 0 0 1 0 12" />
    </>
  ),
  redo: (
    <>
      <path d="M15 7l5 5-5 5" />
      <path d="M20 12H10a6 6 0 0 0 0 12" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

type IconProps = {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  /** With a title the icon is announced (role="img"). */
  title?: string
}

export function Icon({ name, size = 20, strokeWidth = 1.7, className, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

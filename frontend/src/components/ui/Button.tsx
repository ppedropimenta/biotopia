import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '../../lib/cx'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonClasses'
import { Icon, type IconName } from './Icon'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconEnd?: IconName
  children: ReactNode
}

export function Button({
  variant,
  size,
  icon,
  iconEnd,
  className,
  children,
  type = 'button',
  ...rest
}: CommonProps & ComponentProps<'button'>) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={16} strokeWidth={2} />}
      {children}
      {iconEnd && <EndIcon name={iconEnd} />}
    </button>
  )
}

export function ButtonLink({ variant, size, icon, iconEnd, className, children, ...rest }: CommonProps & LinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={16} strokeWidth={2} />}
      {children}
      {iconEnd && <EndIcon name={iconEnd} />}
    </Link>
  )
}

/** The icon after the label; it leans forward a little when the button is hovered or focused. */
function EndIcon({ name }: { name: IconName }) {
  return (
    <span className="inline-flex transition-[translate] duration-200 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1">
      <Icon name={name} size={18} strokeWidth={1.8} />
    </span>
  )
}

/** A button with only an icon; `label` is its accessible name. */
export function IconButton({
  icon,
  label,
  className,
  type = 'button',
  ...rest
}: { icon: IconName; label: string } & ComponentProps<'button'>) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(
        'inline-flex size-11 cursor-pointer items-center justify-center rounded-paper border border-ink/50 text-ink transition-[background-color,scale] duration-150 ease-out hover:bg-paper-card active:scale-[0.95]',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={18} strokeWidth={1.8} />
    </button>
  )
}

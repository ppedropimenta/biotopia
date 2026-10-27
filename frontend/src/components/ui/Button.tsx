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
      {iconEnd && <Icon name={iconEnd} size={18} strokeWidth={1.8} />}
    </button>
  )
}

export function ButtonLink({ variant, size, icon, iconEnd, className, children, ...rest }: CommonProps & LinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={16} strokeWidth={2} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={18} strokeWidth={1.8} />}
    </Link>
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
        'inline-flex size-11 cursor-pointer items-center justify-center rounded-paper border border-ink/50 text-ink hover:bg-paper-card',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={18} strokeWidth={1.8} />
    </button>
  )
}

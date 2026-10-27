import type { ReactNode } from 'react'
import { Icon } from '../components/ui/Icon'

/** An error about the whole form rather than one field. A mark and words, so colour is not the only signal. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="m-0 flex items-center gap-2 font-mono text-[0.8125rem] text-cardinal">
      <Icon name="warning" size={16} strokeWidth={2} />
      {children}
    </p>
  )
}

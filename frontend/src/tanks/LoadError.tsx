import { useTranslation } from 'react-i18next'
import { describeTankError } from './form'

/** What a tank page shows when its tank could not be loaded. The message is the page's title. */
export function LoadError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  return (
    <h1
      role="alert"
      className="font-serif text-[clamp(30px,4vw,56px)] leading-tight tracking-[-0.02em] [overflow-wrap:anywhere]"
    >
      {t(describeTankError(error).general ?? 'tanks.errors.generic')}
    </h1>
  )
}

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from './Field'

/**
 * A password on the notebook line, with a Show / Hide button at the end. Seeing what was typed helps with a long
 * password on a phone. It goes back to hidden when the form is sent, so the browser offers to save it as a password.
 */
export function PasswordField(props: Omit<ComponentProps<typeof TextField>, 'type' | 'trailing'>) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(false)
  const anchor = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const form = anchor.current?.closest('form')
    if (!form) return
    const hide = () => setShown(false)
    form.addEventListener('submit', hide)
    return () => form.removeEventListener('submit', hide)
  }, [])

  return (
    <TextField
      {...props}
      type={shown ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <span ref={anchor} className="flex-none self-center">
          <button
            type="button"
            onClick={() => setShown((now) => !now)}
            className="min-h-11 cursor-pointer bg-transparent px-2 font-mono text-caption tracking-[0.12em] text-ink-muted uppercase hover:text-ink"
          >
            {shown ? t('auth.hidePassword') : t('auth.showPassword')}
          </button>
        </span>
      }
    />
  )
}

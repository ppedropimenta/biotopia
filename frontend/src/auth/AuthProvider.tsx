import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import i18n, { changeLanguage } from '../i18n'
import type { Language } from '../i18n/language'
import { api, type Account } from './api'
import { AuthContext, type Auth, type AuthState } from './context'

// The language saved on the account wins over what this browser remembers, so it follows the person
// from device to device.
function restoreLanguage(account: Account) {
  if (account.language !== i18n.language) void changeLanguage(account.language)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api
      .me()
      .then((account) => {
        if (cancelled) return
        if (account) restoreLanguage(account)
        setState(account ? { status: 'in', account } : { status: 'out' })
      })
      // The API is unreachable: treat the visitor as logged out so the public pages still work.
      .catch(() => !cancelled && setState({ status: 'out' }))
    return () => {
      cancelled = true
    }
  }, [])

  const logIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const account = await api.logIn(email, password, remember)
    restoreLanguage(account)
    setState({ status: 'in', account })
  }, [])

  const logOut = useCallback(async () => {
    await api.logOut()
    setState({ status: 'out' })
  }, [])

  const chooseLanguage = useCallback(
    async (language: Language) => {
      await changeLanguage(language)
      if (state.status !== 'in') return
      setState({ status: 'in', account: { ...state.account, language } })
      // If saving fails the screen is still in the chosen language; it is saved on the next change.
      await api.saveLanguage(language).catch(() => undefined)
    },
    [state],
  )

  const auth = useMemo<Auth>(() => ({ state, logIn, logOut, chooseLanguage }), [state, logIn, logOut, chooseLanguage])
  return <AuthContext value={auth}>{children}</AuthContext>
}

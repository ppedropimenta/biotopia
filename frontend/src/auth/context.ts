import { createContext, useContext } from 'react'
import type { Language } from '../i18n/language'
import type { Account } from './api'

export type AuthState = { status: 'loading' } | { status: 'out' } | { status: 'in'; account: Account }

export type Auth = {
  state: AuthState
  logIn: (email: string, password: string, remember: boolean) => Promise<void>
  logOut: () => Promise<void>
  /** The server has already ended the session (the account was deleted): forget it here. */
  signedOut: () => void
  /** Switches the app language and, when someone is logged in, saves it on their account. */
  chooseLanguage: (language: Language) => Promise<void>
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth needs an AuthProvider above it')
  return auth
}

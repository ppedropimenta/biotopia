import { Outlet } from 'react-router'
import { useAuth } from './context'

/**
 * The frame of the account pages. The pages bring their own frame (AuthScreen), which has the brand and the
 * language switch, so the public header and footer stay out of these routes.
 */
export function AuthLayout() {
  const { state } = useAuth()

  // While the session is being checked, show the blackwater and nothing else (as Layout does).
  if (state.status === 'loading') return <div className="min-h-svh texture-river" />
  return <Outlet />
}

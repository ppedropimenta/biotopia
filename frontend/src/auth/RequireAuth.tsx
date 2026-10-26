import { Navigate, Outlet } from 'react-router'
import { useAuth } from './context'

/** Pages inside it need a login. While the session is still being checked it shows nothing. */
export function RequireAuth() {
  const { state } = useAuth()
  if (state.status === 'loading') return null
  if (state.status === 'out') return <Navigate to="/login" replace />
  return <Outlet />
}

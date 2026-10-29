import { Navigate, Outlet, useParams } from 'react-router'
import { useLoad } from '../tanks/useLoad'
import { api } from './api'
import { useAuth } from './context'

/**
 * Like RequireAuth, but a visitor may read the Demo Tank's pages: it asks the server which tank is the demo and
 * lets the visitor in only for that one.
 */
export function RequireAuthUnlessDemo() {
  const { state } = useAuth()
  const { id } = useParams()
  const demo = useLoad(() => (state.status === 'out' ? api.demoTank().catch(() => null) : Promise.resolve(null)), `demo-${state.status}`)

  if (state.status === 'loading') return null
  if (state.status === 'in') return <Outlet />
  if (demo.status === 'loading') return null
  if (demo.status === 'ready' && demo.data?.id === id) return <Outlet />
  return <Navigate to="/login" replace />
}

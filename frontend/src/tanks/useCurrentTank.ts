import { useEffect, useState } from 'react'
import { useLocation, useMatch } from 'react-router'
import { api } from '../auth/api'

type CurrentTank = { id: string; name: string; readOnly: boolean }

/**
 * The tank the keeper is inside (any /tanks/:id page), for the side menu. It reads the tank again on every
 * move inside the app, so a renamed tank shows its new name. Anything that fails just shows no tank.
 */
export function useCurrentTank(): CurrentTank | undefined {
  const match = useMatch('/tanks/:id/*')
  const id = match?.params.id
  const inTank = id !== undefined && id !== 'new'
  const { key } = useLocation()
  const [tank, setTank] = useState<CurrentTank | null>(null)

  useEffect(() => {
    if (!inTank) return
    let current = true
    api.tank(id).then(
      (found) => current && setTank({ id, name: found.name, readOnly: found.readOnly }),
      () => current && setTank(null),
    )
    return () => {
      current = false
    }
  }, [id, inTank, key])

  return inTank && tank?.id === id ? tank : undefined
}

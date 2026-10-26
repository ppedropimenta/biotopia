import { useEffect, useState } from 'react'

export type Loaded<T> = { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T }

/** Runs `load` when `key` changes and tracks its result. An answer that arrives after the page moved on is dropped. */
export function useLoad<T>(load: () => Promise<T>, key: string): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ status: 'loading' })

  useEffect(() => {
    let current = true
    setState({ status: 'loading' })
    load().then(
      (data) => current && setState({ status: 'ready', data }),
      (error) => current && setState({ status: 'error', error }),
    )
    return () => {
      current = false
    }
    // `load` is a new function on every render; the key says when a different load is wanted.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}

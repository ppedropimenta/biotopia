import { useLocation, type Location } from 'react-router'

type ReturnState = { from?: unknown }

/**
 * The link state that brings a form back to this page when it is done: the same address, with `hash` to land on one
 * spot of it.
 */
export function returnHere(location: Location, hash = ''): ReturnState {
  return { from: location.pathname + location.search + hash }
}

/** Where a form goes when it is saved or cancelled: the page that opened it (see `returnHere`), or `fallback`. */
export function useReturnTo(fallback: string): string {
  const from = (useLocation().state as ReturnState | null)?.from
  // Only an address inside the app: link state is under the page's control, but a path keeps it that way.
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : fallback
}

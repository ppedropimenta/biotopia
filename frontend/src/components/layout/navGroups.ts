import type { TFunction } from 'i18next'
import type { NavGroup } from './AppShell'

/**
 * The groups of the menu. Only screens that exist are listed: My tanks, and the overview and timeline of
 * the tank the keeper is in.
 */
export function navGroups(t: TFunction, tank?: { id: string; name: string }): NavGroup[] {
  const groups: NavGroup[] = [{ items: [{ to: '/tanks', label: t('ui.nav.myTanks'), icon: 'tank', end: true }] }]
  if (tank) {
    groups.push({
      label: tank.name,
      items: [
        { to: `/tanks/${tank.id}`, label: t('ui.nav.overview'), icon: 'gauge', end: true },
        { to: `/tanks/${tank.id}/timeline`, label: t('ui.nav.timeline'), icon: 'timeline' },
      ],
    })
  }
  return groups
}

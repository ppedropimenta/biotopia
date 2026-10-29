import type { TFunction } from 'i18next'
import type { NavGroup } from './AppShell'

/** The menu of a visitor reading the Demo Tank: its four screens, nothing of an account. */
export function demoNavGroups(t: TFunction, tank: { id: string }): NavGroup[] {
  return [
    {
      label: t('ui.nav.demoGroup'),
      items: [
        { to: `/tanks/${tank.id}`, label: t('ui.nav.overview'), icon: 'gauge', end: true },
        { to: `/tanks/${tank.id}/timeline`, label: t('ui.nav.timeline'), icon: 'timeline' },
        { to: `/tanks/${tank.id}/maintenance`, label: t('ui.nav.maintenance'), icon: 'bucket' },
        { to: `/tanks/${tank.id}/photos`, label: t('ui.nav.photos'), icon: 'camera' },
      ],
    },
  ]
}

/**
 * The groups of the menu. Only screens that exist are listed: My tanks, and the overview, timeline,
 * maintenance and photos of the tank the keeper is in.
 */
export function navGroups(t: TFunction, tank?: { id: string; name: string }): NavGroup[] {
  const groups: NavGroup[] = [{ items: [{ to: '/tanks', label: t('ui.nav.myTanks'), icon: 'tank', end: true }] }]
  if (tank) {
    groups.push({
      label: tank.name,
      items: [
        { to: `/tanks/${tank.id}`, label: t('ui.nav.overview'), icon: 'gauge', end: true },
        { to: `/tanks/${tank.id}/timeline`, label: t('ui.nav.timeline'), icon: 'timeline' },
        { to: `/tanks/${tank.id}/maintenance`, label: t('ui.nav.maintenance'), icon: 'bucket' },
        { to: `/tanks/${tank.id}/photos`, label: t('ui.nav.photos'), icon: 'camera' },
      ],
    })
  }
  return groups
}

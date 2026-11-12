import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { api } from '../auth/api'
import { FormError } from '../auth/FormError'
import { Button } from '../components/ui/Button'
import { SectionHeader } from '../components/ui/Structure'
import { describeTankError } from './form'
import type { Tank } from './types'

type Pending = 'archive' | 'delete' | null

/**
 * What a keeper can do with a tank that is no longer wanted: archive it (or bring an archived one back), or
 * delete it for good. Each step asks first, in words that say what will go.
 */
export function TankLifecycle({ tank, onChanged }: { tank: Tank; onChanged: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>, then: () => void) {
    setBusy(true)
    setProblem(null)
    try {
      await action()
      setPending(null)
      then()
    } catch (error) {
      setProblem(t(describeTankError(error).general ?? 'tanks.errors.generic'))
    }
    setBusy(false)
  }

  return (
    <section aria-labelledby="lifecycle-title" className="flex flex-col gap-4 border-t border-dashed border-ink/45 pt-6">
      <SectionHeader title={<span id="lifecycle-title">{t('tanks.lifecycle.sectionTitle')}</span>} level={3} />
      <p className="m-0 max-w-[78ch] text-ink-soft">{t('tanks.lifecycle.sectionLead')}</p>
      {problem && <FormError>{problem}</FormError>}

      {pending === null ? (
        <div className="flex flex-wrap gap-3">
          {tank.archivedAt ? (
            <Button variant="secondary" disabled={busy} onClick={() => run(() => api.restoreTank(tank.id), onChanged)}>
              {busy ? t('tanks.lifecycle.working') : t('tanks.lifecycle.restore')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setPending('archive')}>
              {t('tanks.lifecycle.archive')}
            </Button>
          )}
          <Button variant="dashed" onClick={() => setPending('delete')}>
            {t('tanks.lifecycle.delete')}
          </Button>
        </div>
      ) : (
        <div
          role="group"
          aria-label={t(pending === 'archive' ? 'tanks.lifecycle.archive' : 'tanks.lifecycle.delete')}
          className="flex max-w-[78ch] flex-col gap-3"
        >
          <p className="m-0 text-lead">
            {pending === 'archive'
              ? t('tanks.lifecycle.archiveWhat')
              : t('tanks.lifecycle.deleteWhat', { name: tank.name })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                pending === 'archive'
                  ? run(() => api.archiveTank(tank.id), onChanged)
                  : run(() => api.deleteTank(tank.id), () => navigate('/tanks'))
              }
            >
              {busy
                ? t('tanks.lifecycle.working')
                : t(pending === 'archive' ? 'tanks.lifecycle.confirmYes' : 'tanks.lifecycle.confirmDelete')}
            </Button>
            <Button variant="dashed" disabled={busy} onClick={() => setPending(null)}>
              {t('tanks.lifecycle.confirmNo')}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

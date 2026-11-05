import { useTranslation } from 'react-i18next'
import { Sparkline } from '../../components/ui/Measures'
import { cx } from '../../lib/cx'
import { valueDecimals, type ParameterCode } from '../../tanks/measurements'
import { formatNumber } from '../../tanks/numbers'
import type { Panel } from '../../tanks/series'
import { useLanguage } from '../../tanks/useLanguage'
import { Delta } from './Controls'
import { lastChange } from './shared'

/**
 * A row of Parameter tiles, each with its latest value, the change since the one before and its last two weeks. With
 * `selected` the tiles are a switch (the chart shows the pressed one); without it they are buttons that open it.
 */
export function ParameterTiles({
  panels,
  selected,
  onPick,
  label,
}: {
  panels: readonly Panel[]
  selected?: ParameterCode
  onPick: (parameter: ParameterCode) => void
  label: string
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const number = (value: number) => formatNumber(value, language, { maxDecimals: valueDecimals })
  return (
    <div
      role="group"
      aria-label={label}
      className="relative -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 min-[900px]:grid min-[900px]:grid-cols-[repeat(auto-fit,minmax(132px,1fr))] min-[900px]:overflow-visible"
    >
      {panels.map((p) => {
        const last = p.points[p.points.length - 1]
        const change = lastChange(p)
        const pressed = selected === undefined ? undefined : selected === p.parameter
        return (
          <button
            key={p.parameter}
            type="button"
            aria-pressed={pressed}
            onClick={() => onPick(p.parameter)}
            className={cx(
              'flex min-h-11 w-36 shrink-0 cursor-pointer snap-start flex-col gap-1 px-3 pt-2.5 pb-2 text-left min-[900px]:w-auto',
              pressed ? 'texture-card border-[1.5px] border-ink shadow-plate-sm' : 'border border-ink/40 text-ink hover:bg-paper-card',
            )}
          >
            <span className="font-mono text-caption text-ink-muted">{t(`parameters.${p.parameter}`)}</span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-h3 leading-[1.05]">{number(last.value)}</span>
              {p.unit && <span className="font-mono text-caption">{p.unit}</span>}
              {change && <Delta change={change} className="ml-auto font-mono text-caption text-ink" />}
            </span>
            <Sparkline values={p.points.slice(-14).map((q) => q.value)} />
          </button>
        )
      })}
    </div>
  )
}

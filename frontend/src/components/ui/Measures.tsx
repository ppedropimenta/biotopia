import { cx } from '../../lib/cx'
import { scaleLinear, type Range } from '../../lib/ranges'
import { formatNumber } from '../../tanks/numbers'
import { useLanguage } from '../../tanks/useLanguage'

/**
 * A ruler: a scale line, an optional target band in green and the value as a red triangle. `ariaLabel` says
 * the value and where it stands, since the drawing alone does not.
 */
export function RangeRuler({
  scale,
  target,
  value,
  ariaLabel,
  ticks = 4,
  showTickLabels = false,
  maxDecimals = 1,
  height = 20,
  className,
}: {
  scale: Range
  target?: Range
  value?: number
  ariaLabel: string
  ticks?: number
  showTickLabels?: boolean
  maxDecimals?: number
  height?: number
  className?: string
}) {
  const language = useLanguage()
  const width = showTickLabels ? 400 : 160
  const x = scaleLinear(scale, [0, width], true)
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => scale[0] + ((scale[1] - scale[0]) * i) / ticks)
  const bandX = target ? x(target[0]) : 0
  const bandWidth = target ? Math.max(5, x(target[1]) - x(target[0])) : 0
  const viewHeight = showTickLabels ? 34 : 20
  const lineY = showTickLabels ? 14 : 9
  const number = (n: number) => formatNumber(n, language, { maxDecimals })
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${viewHeight}`}
      preserveAspectRatio="none"
      className={cx('block w-full', className)}
      style={{ height }}
    >
      {target && (
        <rect
          x={bandX}
          y={showTickLabels ? 8 : 5}
          width={bandWidth}
          height={showTickLabels ? 12 : 8}
          fill="var(--color-forest)"
          fillOpacity={0.28}
          stroke={showTickLabels ? 'var(--color-forest)' : 'none'}
        />
      )}
      <line x1="0" y1={lineY} x2={width} y2={lineY} stroke="var(--color-ink)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {!showTickLabels &&
        tickValues.map((tick, i) => (
          <line
            key={i}
            x1={x(tick)}
            y1={i === 0 || i === ticks ? 5 : 6}
            x2={x(tick)}
            y2={i === 0 || i === ticks ? 13 : 12}
            stroke="var(--color-ink)"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      {showTickLabels && (
        <g fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-ink-muted)">
          <text x="0" y="33">
            {number(scale[0])}
          </text>
          {target && (
            <>
              <text x={x(target[0])} y="33" textAnchor="middle">
                {number(target[0])}
              </text>
              <text x={x(target[1])} y="33" textAnchor="middle">
                {number(target[1])}
              </text>
            </>
          )}
          <text x={width} y="33" textAnchor="end">
            {number(scale[1])}
          </text>
        </g>
      )}
      {value !== undefined && (
        <path
          d={`M${x(value)} ${lineY} l-${showTickLabels ? 6 : 5} -${showTickLabels ? 12 : 8} h${showTickLabels ? 12 : 10} z`}
          fill="var(--color-cardinal)"
          stroke="var(--color-ink)"
          strokeWidth="0.8"
        />
      )}
    </svg>
  )
}

/**
 * One Parameter of the latest Measurement: the name, a big value with its unit, how it changed since the
 * previous one and a ruler. The caller formats the text, in the language, and works out the change. The
 * change has a symbol and a text, never colour alone.
 */
export function ParamTile({
  name,
  value,
  unit,
  change,
  scale,
  rulerValue,
  rulerLabel,
  note,
  className,
}: {
  name: string
  /** Already formatted. */
  value: string
  unit?: string
  change?: { symbol: '▲' | '▼' | '='; text: string; label: string }
  scale: Range
  /** The plain number, for the position of the triangle on the ruler. */
  rulerValue?: number
  rulerLabel: string
  /** A line under the ruler, such as when it was measured. */
  note?: string
  className?: string
}) {
  return (
    <div className={cx('flex flex-col gap-1 border border-ink texture-card px-3.5 pt-3 pb-2.5', className)}>
      <div className="flex justify-between gap-2 font-mono text-[0.71875rem] text-ink-muted">
        <span>{name}</span>
        {change && (
          <span>
            <span aria-hidden="true">
              {change.symbol} {change.text}
            </span>
            <span className="sr-only">{change.label}</span>
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[2.375rem] leading-[1.05]">{value}</span>
        {unit && <span className="font-mono text-[0.8125rem]">{unit}</span>}
      </div>
      <RangeRuler scale={scale} value={rulerValue} ariaLabel={rulerLabel} />
      {note && <span className="font-mono text-[0.71875rem] text-ink-muted">{note}</span>}
    </div>
  )
}

/** A bare line with no axis, for cards. Decorative: the numbers sit beside it. */
export function Sparkline({ values, tone = 'ink', className }: { values: readonly number[]; tone?: 'ink' | 'cardinal'; className?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const x = scaleLinear([0, values.length - 1], [2, 88])
  const y = scaleLinear(max === min ? [min - 1, max + 1] : [min, max], [20, 4])
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <svg aria-hidden="true" viewBox="0 0 90 24" className={cx('block h-[22px] w-full', className)}>
      <path d={d} fill="none" stroke={tone === 'cardinal' ? 'var(--color-cardinal)' : 'var(--color-ink)'} strokeWidth="1.4" />
    </svg>
  )
}

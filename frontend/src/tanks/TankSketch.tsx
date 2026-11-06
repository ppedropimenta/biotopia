import { useTranslation } from 'react-i18next'
import { fishArt } from '../lib/illustrations'
import { formatNumber } from './numbers'
import { useLanguage } from './useLanguage'
import { useSmooth } from './useSmooth'

/** The depth of the tank is drawn going up and to the right, at these shares of its length. */
const depthX = 0.42
const depthY = 0.26

export type Dimension = 'length' | 'width' | 'height'

/** Used for the drawing while a dimension is missing, so there is a tank to see before there are numbers. */
const usual = { length: 80, width: 35, height: 45 }

/** [where along the tank, how deep in the water, seconds per lap, seconds ahead] of each fish of the school. */
const school = [
  [0.22, 0.38, 6.4, 0],
  [0.36, 0.55, 7.8, 0.8],
  [0.5, 0.3, 5.6, 1.6],
  [0.64, 0.5, 8.4, 0.4],
  [0.78, 0.36, 6.9, 2.2],
] as const
const plants = [0.14, 0.46, 0.84]

/**
 * The tank drawn to its dimensions, in an oblique view: a box that grows and shrinks as they change, water at a
 * fixed height, a little substrate, plants and a school of cardinals. It stands where a photo of the tank will
 * stand. The water does not follow the Net Volume, which also leaves out substrate, wood and decoration. The
 * dimension being edited is lit. While one is missing, a dashed tank of usual size stands in.
 */
export function TankSketch({
  lengthCm,
  widthCm,
  heightCm,
  focus = null,
}: {
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  focus?: Dimension | null
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const known = lengthCm !== null && widthCm !== null && heightCm !== null && lengthCm > 0 && widthCm > 0 && heightCm > 0
  const L = useSmooth(lengthCm && lengthCm > 0 ? lengthCm : usual.length)
  const W = useSmooth(widthCm && widthCm > 0 ? widthCm : usual.width)
  const H = useSmooth(heightCm && heightCm > 0 ? heightCm : usual.height)

  const scale = Math.min(292 / (L + W * depthX), 168 / (H + W * depthY))
  const fw = L * scale
  const fh = H * scale
  const dx = W * scale * depthX
  const dy = W * scale * depthY
  const x0 = 70 + (292 - (fw + dx)) / 2
  const yb = 236 - (168 - (fh + dy)) / 2
  const yt = yb - fh
  const yw = yb - fh * 0.9
  const sub = fh * 0.09

  const ink = 'var(--color-river-text)'
  const dash = known ? undefined : '5 5'
  const sand = 'var(--color-water-white)'
  const lit = (dimension: Dimension) => (focus === dimension ? 'var(--color-amber)' : 'var(--color-river-muted)')
  const fishWidth = Math.max(18, Math.min(40, fw * 0.12))
  const cm = (value: number | null) => (value && value > 0 ? `${formatNumber(value, language)} cm` : null)

  return (
    <svg viewBox="0 0 420 290" role="img" aria-label={t('tanks.sketch.alt')} className="block h-auto w-full">
      {/* the back and the sides of the box */}
      <g fill="none" stroke={ink} strokeOpacity={0.28} strokeWidth={1.2} strokeDasharray={dash}>
        <rect x={x0 + dx} y={yt - dy} width={fw} height={fh} />
        <path d={`M${x0} ${yt}L${x0 + dx} ${yt - dy}M${x0 + fw} ${yt}L${x0 + fw + dx} ${yt - dy}M${x0 + fw} ${yb}L${x0 + fw + dx} ${yb - dy}M${x0} ${yb}L${x0 + dx} ${yb - dy}`} />
      </g>

      {known && (
        <g>
          {/* water: the back, the surface, the side and the front */}
          <rect x={x0 + dx} y={yw - dy} width={fw} height={yb - yw} fill="#4f9bc4" fillOpacity={0.14} />
          <polygon points={`${x0},${yw} ${x0 + fw},${yw} ${x0 + fw + dx},${yw - dy} ${x0 + dx},${yw - dy}`} fill="#8fd0ec" fillOpacity={0.3} />
          <polygon points={`${x0 + fw},${yw} ${x0 + fw + dx},${yw - dy} ${x0 + fw + dx},${yb - dy} ${x0 + fw},${yb}`} fill="#4f9bc4" fillOpacity={0.22} />
          <rect x={x0} y={yw} width={fw} height={yb - yw} fill="#4f9bc4" fillOpacity={0.3} />
          <line x1={x0} y1={yw} x2={x0 + fw} y2={yw} stroke="#bfe6f5" strokeOpacity={0.75} strokeWidth={1.5} />
          {/* substrate: the front, the top, the side and the back, so it is solid from every side we see */}
          <rect x={x0} y={yb - sub} width={fw} height={sub} fill={sand} fillOpacity={0.9} />
          <polygon points={`${x0},${yb - sub} ${x0 + fw},${yb - sub} ${x0 + fw + dx},${yb - sub - dy} ${x0 + dx},${yb - sub - dy}`} fill={sand} fillOpacity={0.55} />
          <polygon points={`${x0 + fw},${yb - sub} ${x0 + fw + dx},${yb - sub - dy} ${x0 + fw + dx},${yb - dy} ${x0 + fw},${yb}`} fill={sand} fillOpacity={0.75} />
          <rect x={x0 + dx} y={yb - sub - dy} width={fw} height={sub} fill={sand} fillOpacity={0.35} />
        </g>
      )}

      {known && fh > 36 && (
        <g fill="none" stroke="#9cc474" strokeWidth={2.2} strokeLinecap="round">
          {plants.map((share, i) => {
            const px = x0 + fw * share
            const top = fh * (0.42 + (0.16 * ((i * 2) % 3)) / 2)
            const by = yb - sub
            return (
              <g key={share}>
                <path d={`M${px} ${by}C${px - 6} ${by - top * 0.4} ${px + 8} ${by - top * 0.7} ${px + 2} ${by - top}`} />
                <path d={`M${px + 5} ${by}C${px + 12} ${by - top * 0.35} ${px - 2} ${by - top * 0.6} ${px + 10} ${by - top * 0.85}`} />
                <path d={`M${px - 6} ${by}C${px - 14} ${by - top * 0.3} ${px - 6} ${by - top * 0.5} ${px - 12} ${by - top * 0.7}`} />
              </g>
            )
          })}
        </g>
      )}

      {known && fh > 50 && (
        <g>
          {school.map(([share, depth, seconds, ahead]) => (
            <g key={share} className="swim" style={{ ['--swim-duration' as string]: `${seconds}s`, ['--swim-delay' as string]: `-${ahead}s` }}>
              <image
                href={fishArt['paracheirodon-axelrodi'].src}
                x={x0 + fw * share - fishWidth / 2}
                y={yw + (yb - sub - yw) * depth - fishWidth * 0.2}
                width={fishWidth}
                height={fishWidth * (170 / 420)}
              />
            </g>
          ))}
        </g>
      )}

      {/* the front glass and the top and side edges */}
      <rect x={x0} y={yt} width={fw} height={fh} fill="#e6dac0" fillOpacity={0.05} stroke={ink} strokeWidth={2.6} strokeDasharray={dash} strokeLinejoin="round" />
      <path d={`M${x0} ${yt}L${x0 + dx} ${yt - dy}L${x0 + fw + dx} ${yt - dy}L${x0 + fw} ${yt}`} fill="none" stroke={ink} strokeOpacity={0.7} strokeWidth={1.6} strokeDasharray={dash} strokeLinejoin="round" />
      <path d={`M${x0 + fw} ${yt}L${x0 + fw + dx} ${yt - dy}L${x0 + fw + dx} ${yb - dy}L${x0 + fw} ${yb}`} fill="#e6dac0" fillOpacity={0.04} stroke={ink} strokeOpacity={0.7} strokeWidth={1.6} strokeDasharray={dash} strokeLinejoin="round" />

      {/* the dimensions, as on a drawing board */}
      <g fontFamily="var(--font-mono)" fontSize={11} letterSpacing={0.6}>
        <g stroke={lit('length')} fill={lit('length')}>
          <line x1={x0} y1={yb + 14} x2={x0 + fw} y2={yb + 14} strokeWidth={focus === 'length' ? 2 : 1} />
          <line x1={x0} y1={yb + 9} x2={x0} y2={yb + 19} />
          <line x1={x0 + fw} y1={yb + 9} x2={x0 + fw} y2={yb + 19} />
          <text x={x0 + fw / 2} y={yb + 32} textAnchor="middle" stroke="none">
            {cm(lengthCm) ?? t('tanks.sketch.length')}
          </text>
        </g>
        <g stroke={lit('height')} fill={lit('height')}>
          <line x1={x0 - 14} y1={yt} x2={x0 - 14} y2={yb} strokeWidth={focus === 'height' ? 2 : 1} />
          <line x1={x0 - 19} y1={yt} x2={x0 - 9} y2={yt} />
          <line x1={x0 - 19} y1={yb} x2={x0 - 9} y2={yb} />
          <text x={x0 - 22} y={yt + fh / 2} textAnchor="middle" stroke="none" transform={`rotate(-90 ${x0 - 22} ${yt + fh / 2})`}>
            {cm(heightCm) ?? t('tanks.sketch.height')}
          </text>
        </g>
        <g stroke={lit('width')} fill={lit('width')}>
          <line x1={x0 + fw + 12} y1={yb + 3} x2={x0 + fw + dx + 12} y2={yb - dy + 3} strokeWidth={focus === 'width' ? 2 : 1} />
          <text x={x0 + fw + dx / 2 + 22} y={yb - dy / 2 + 14} stroke="none">
            {cm(widthCm) ?? t('tanks.sketch.width')}
          </text>
        </g>
      </g>
    </svg>
  )
}

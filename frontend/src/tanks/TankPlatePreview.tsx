import { Trans, useTranslation } from 'react-i18next'
import { ToggleChip } from '../components/ui/Chip'
import { Plate, PlateCorners } from '../components/ui/Plate'
import { Stamp } from '../components/ui/Stamp'
import { cx } from '../lib/cx'
import { roman } from '../lib/roman'
import { formatDay } from './dates'
import { formatNumber } from './numbers'
import { TankSketch, type Dimension } from './TankSketch'
import { useLanguage } from './useLanguage'
import { formatVolume, type Volume } from './volume'

/** The percentages of the water change that the plate uses as its example. */
const examples = [20, 30, 50]

/**
 * The plate this tank will have in the list of tanks, filled in while the form is typed. The drawing of the tank stands
 * where its photo will, on the dark brown of the tank drawings. The volume block shows the Volume the calculations use
 * and what a water change comes to in liters; with `showVolume` off it is still there, unseen, so the plate keeps its size.
 */
export function TankPlatePreview({
  number,
  name,
  startDate,
  dimensions,
  volume,
  showVolume,
  focus,
  example,
  onExample,
}: {
  number: number
  name: string
  startDate: string
  dimensions: { length: number | null; width: number | null; height: number | null }
  volume: Volume | null
  showVolume: boolean
  focus: Dimension | null
  example: number
  onExample: (percent: number) => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const { length, width, height } = dimensions
  const size =
    length !== null && width !== null && height !== null
      ? t('tanks.plate.size', { length: formatNumber(length, language), width: formatNumber(width, language), height: formatNumber(height, language) })
      : null
  const since = startDate === '' ? null : t('tanks.plate.since', { date: formatDay(startDate, language) })
  const facts = [size, since].filter(Boolean).join(' · ')
  // A figure and its unit never part at the end of a line.
  const withUnit = (liters: number) => `${formatNumber(Math.round(liters), language)} L`

  return (
    <Plate size="md" as="div" aria-label={t('tanks.form.preview.label')} className="flex flex-col gap-3.5">
      <PlateCorners items={[`${t('ui.plate.plate')} ${roman(number)}`, t('tanks.form.preview.corner')]} />
      <div className="bg-blackwater p-3">
        <TankSketch lengthCm={length} widthCm={width} heightCm={height} focus={focus} />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className={cx('m-0 text-h3 leading-[1.1] font-medium [overflow-wrap:anywhere]', name === '' && 'text-ink-muted/60')}>
          {name === '' ? t('tanks.form.preview.namePlaceholder') : name}
        </p>
        <span className="font-mono text-label text-ink-muted">{facts === '' ? t('tanks.form.preview.factsPlaceholder') : facts}</span>
      </div>
      <div className={cx('flex items-center gap-4 border-y border-ink/35 py-3', !showVolume && 'invisible')} aria-hidden={!showVolume}>
        <span aria-hidden="true" className="flex w-[112px] flex-none justify-center">
          {volume === null ? (
            <Stamp size="xl" tone="muted" dashed main="? L" />
          ) : (
            <Stamp
              key={`${volume.kind}-${Math.round(volume.liters)}`}
              className="rise"
              size="xl"
              tone={volume.kind === 'net' ? 'neon' : 'ochre'}
              rotate={-7}
              top={t(`tanks.form.preview.${volume.kind}`)}
              main={`${formatVolume(volume, language)} L`}
            />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="m-0 text-lead leading-[1.3]" aria-live="polite">
            {volume === null ? (
              t('tanks.form.preview.noVolume')
            ) : (
              <Trans
                i18nKey="tanks.form.preview.example"
                values={{ percent: example, liters: withUnit((volume.liters * example) / 100) }}
                components={{ b: <b className="font-medium" /> }}
              />
            )}
          </p>
          <div role="group" aria-label={t('tanks.form.preview.exampleLabel')} className="flex flex-wrap gap-1.5">
            {examples.map((percent) => (
              <ToggleChip key={percent} variant="check" pressed={example === percent} onClick={() => onExample(percent)} className="min-h-9 px-2.5">
                {percent}%
              </ToggleChip>
            ))}
          </div>
        </div>
      </div>
    </Plate>
  )
}

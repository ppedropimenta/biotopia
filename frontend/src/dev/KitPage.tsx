import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell, LogMeasurementCta, SideNav } from '../components/layout/AppShell'
import { navGroups } from '../components/layout/navGroups'
import { Binomial, Illustration } from '../components/ui/Brand'
import { Button, ButtonLink, IconButton } from '../components/ui/Button'
import { ChipGroup, Segmented, Tag, ToggleChip } from '../components/ui/Chip'
import { NoteField, Stepper, TextField } from '../components/ui/Field'
import { ParamTile, RangeRuler, Sparkline } from '../components/ui/Measures'
import { Handwritten, Polaroid, SpecimenLabel } from '../components/ui/Paper'
import { Plate } from '../components/ui/Plate'
import { Stamp } from '../components/ui/Stamp'
import { PageHeader, SectionHeader } from '../components/ui/Structure'
import { fishArt, tankArt } from '../lib/illustrations'
import { roman } from '../lib/roman'

/**
 * Every component of the kit in one page, for checking them against the kit's screenshots. It exists only in
 * development builds (see App.tsx), so its texts are plain English and not in the translations.
 */
export default function KitPage() {
  const { t } = useTranslation()
  const [temperature, setTemperature] = useState(27.5)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [period, setPeriod] = useState('w12')

  return (
    <AppShell
      nav={
        <SideNav
          groups={navGroups(t, { id: 'demo', name: 'Blackwater 120' })}
          cta={<LogMeasurementCta to="/tanks/demo/measure" />}
        />
      }
    >
      <PageHeader
        breadcrumbs={[{ label: 'Dev', to: '/' }, { label: 'Kit' }]}
        title="Components"
        subtitle="Everything the screens are built from."
        actions={
          <>
            <Button variant="secondary" icon="plus">
              Add
            </Button>
            <Button icon="plus">Measurement</Button>
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Buttons" />
        <div className="flex flex-wrap items-center gap-3">
          <Button>Save measurement</Button>
          <Button variant="secondary">Edit</Button>
          <Button variant="dashed" icon="plus">
            Another parameter
          </Button>
          <IconButton icon="undo" label="Undo" />
          <div className="flex gap-3 texture-river p-3">
            <ButtonLink to="/signup" variant="amber" size="lg" iconEnd="arrowRight">
              Create an account
            </ButtonLink>
            <ButtonLink to="/login" variant="onDark">
              Log in
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-7">
        <Plate corners={[`Plate ${roman(1)}`, 'Blackwater', 'Fig. 1']} as="figure">
          <Illustration slug="paracheirodon-axelrodi" alt="Paracheirodon axelrodi" className="my-3" />
          <figcaption className="border-t border-ink/40 pt-3">
            <span className="text-[1.625rem]">
              <Binomial>Paracheirodon axelrodi</Binomial>
            </span>{' '}
            <span className="text-[0.9375rem] text-ink-muted">(Schultz, 1956)</span>
          </figcaption>
        </Plate>
        <div className="flex flex-col gap-5">
          <SpecimenLabel
            rows={[
              { label: 'Where', value: 'blackwater streams of the middle and upper Rio Negro' },
              { label: 'Size', value: 'up to 5 cm' },
              { label: 'Water', value: 'black: acid, soft, tea-coloured' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Stamp tone="neon" size="lg" top="WC" main="30%" bottom="54 L" label="Water change of 30%, 54 liters" />
            <Stamp tone="forest" size="lg" rotate={6} main="Pruning" bottom="floaters" />
            <Stamp tone="cardinal" size="lg" rotate={-4} main="Filter" bottom="media" />
            <Stamp tone="muted" size="md" dashed main="✕" />
          </div>
          <Handwritten>cardinals in great colour today</Handwritten>
          <div className="flex flex-wrap gap-2">
            <Tag>pH 4.6–6.2</Tag>
            <Tag>23–29 °C</Tag>
            <Tag tone="warn">jumps · lid</Tag>
            <Tag tone="danger">threatened</Tag>
            <Tag tone="plant">
              <Binomial>Echinodorus</Binomial>
            </Tag>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Filters" />
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <ChipGroup label="Period">
            {(['w4', 'w12', 'm6'] as const).map((value) => (
              <ToggleChip key={value} pressed={period === value} onClick={() => setPeriod(value)}>
                {value}
              </ToggleChip>
            ))}
          </ChipGroup>
          <ChipGroup label="Parameters">
            <ToggleChip variant="check" pressed>
              NO₃
            </ToggleChip>
            <ToggleChip variant="check" pressed={false}>
              GH/KH
            </ToggleChip>
          </ChipGroup>
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Latest measurement" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(176px,100%),1fr))] gap-3">
          <ParamTile
            name="Temperature"
            value="27.5"
            unit="°C"
            change={{ symbol: '▲', text: '0.5', label: 'up 0.5 from the previous measurement' }}
            scale={[22, 32]}
            rulerValue={27.5}
            rulerLabel="Temperature: 27.5 °C"
          />
          <ParamTile
            name="pH"
            value="5.8"
            change={{ symbol: '=', text: '0', label: 'same as the previous measurement' }}
            scale={[4, 8]}
            rulerValue={5.8}
            rulerLabel="pH: 5.8"
          />
        </div>
        <div className="grid max-w-md grid-cols-[130px_1fr] items-center gap-3.5">
          <span>Temperature</span>
          <RangeRuler
            scale={[19, 35]}
            target={[23, 29]}
            value={27.5}
            showTickLabels
            maxDecimals={0}
            height={34}
            ariaLabel="Temperature: 27.5 °C, within 23 to 29 °C"
          />
        </div>
        <div className="w-24">
          <Sparkline values={[12, 14, 13, 15, 16, 22, 30, 15, 12]} tone="cardinal" />
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-8">
        <form className="flex flex-col gap-4 texture-card border border-ink p-5" onSubmit={(event) => event.preventDefault()}>
          <Stepper
            label="Temperature"
            hint="last: 27.5 °C"
            value={temperature}
            onChange={setTemperature}
            step={0.5}
            unit="°C"
            decrementLabel="Decrease"
            incrementLabel="Increase"
          />
          <TextField label="Net volume" unit="L" defaultValue="120" inputMode="numeric" />
          <NoteField label="Note" defaultValue="cardinals eating well, very dark water" />
        </form>
        <div className="flex flex-wrap items-start gap-8 pt-2 pb-6">
          <Polaroid className="w-56" src={tankArt.blackwater.src} alt="Front view" caption="front view" tape rotate={-2} />
          <Polaroid
            className="w-56"
            src={fishArt['paracheirodon-axelrodi'].src}
            alt="Paracheirodon axelrodi, close up"
            caption="close up"
            darkBackground
            rotate={1.5}
          />
        </div>
      </section>
    </AppShell>
  )
}

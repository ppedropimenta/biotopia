import { useTranslation } from 'react-i18next'
import demoTankFish from '../assets/illustrations/tanks/demo-tank-fish.svg?raw'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { Binomial, Illustration } from '../components/ui/Brand'
import { ButtonLink } from '../components/ui/Button'
import { Handwritten, Tape } from '../components/ui/Paper'
import { PlateCorners } from '../components/ui/Plate'
import { plateClasses } from '../components/ui/plateClasses'
import { Stamp } from '../components/ui/Stamp'
import { cx } from '../lib/cx'
import { useReveal } from '../lib/useReveal'
import { formatNumber } from '../tanks/numbers'
import { useLanguage } from '../tanks/useLanguage'

/** The landing page. */
export function HomePage() {
  useReveal()
  return (
    <>
      <Hero />
      <Idea />
      <Features />
      <Demo />
      <Roadmap />
      <Why />
    </>
  )
}

function Hero() {
  const { t } = useTranslation()
  const { state } = useAuth()
  return (
    // The header above has the same texture; the hero starts where the header ends, so the roots carry on.
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden texture-river-wide bg-position-[right_-60px_top_-280px] text-river-bright"
    >
      {/* Wider than the hero, so the drift never shows an edge. */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-4 -right-4 -left-4 min-w-[1100px]">
        <Illustration slug="floating-plants" decorative eager className="sway opacity-90" />
      </div>
      <div className="relative mx-auto grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] items-center gap-14 px-6 pt-28 pb-24">
        <div className="flex flex-col gap-6.5">
          {/* Two lines, the italic one on its own and never broken: the type size (text-hero) is chosen so it fits. */}
          <h1 id="hero-title" className="rise m-0 text-hero font-normal tracking-[-0.02em]">
            {t('home.title')} <br />
            <em className="font-light whitespace-nowrap text-amber">{t('home.titleEmphasis')}</em>
          </h1>
          <p className="rise m-0 [--rise-delay:90ms] max-w-[44ch] text-lead leading-normal text-river-text">{t('home.lead')}</p>
          <div className="rise mt-1.5 [--rise-delay:180ms] flex flex-wrap items-center gap-x-6 gap-y-3">
            {state.status === 'in' ? (
              <ButtonLink to="/tanks" variant="amber" size="lg" iconEnd="arrowRight">
                {t('home.myTanks')}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/demo" variant="amber" size="lg" iconEnd="arrowRight">
                  {t('home.ctaDemo')}
                </ButtonLink>
                <Link to="/signup" className="inline-flex min-h-11 items-center text-base text-river-bright">
                  {t('home.ctaSignUp')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="relative h-[620px]">
          <figure
            className={cx(
              plateClasses('md'),
              'rise absolute top-0 right-0 m-0 [--rise-delay:150ms] w-[92%] -rotate-[1.6deg] shadow-[inset_0_0_0_5px_var(--color-paper-card),inset_0_0_0_6px_rgb(36_26_17/0.55),var(--shadow-float)]',
            )}
          >
            <PlateCorners items={[`${t('ui.plate.plate')} I`, t('home.hero.water'), `${t('ui.plate.fig')} 1`]} />
            <Illustration slug="paracheirodon-axelrodi" decorative eager className="mt-3.5 mb-1.5" />
            <figcaption className="flex flex-col gap-0.5 border-t border-ink/40 pt-3">
              <span className="text-h3">
                <Binomial>Paracheirodon axelrodi</Binomial> <span className="text-sm text-ink-muted">(Schultz, 1956)</span>
              </span>
              <span className="font-mono text-label text-ink-muted">{t('home.hero.caption')}</span>
            </figcaption>
          </figure>
          <figure
            className={cx(
              plateClasses('sm'),
              'rise absolute bottom-0 left-0 m-0 [--rise-delay:330ms] w-[46%] rotate-[2.4deg] shadow-float',
            )}
          >
            <PlateCorners items={[`${t('ui.plate.fig')} 2`]} />
            <Illustration slug="symphysodon-aequifasciatus" decorative eager />
            <figcaption className="text-base">
              <Binomial>Symphysodon aequifasciatus</Binomial>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

/** The demo section: a dark band right after "what fits in the logbook", with the way into the Demo Tank. */
function Demo() {
  const { t } = useTranslation()
  return (
    <section id="demo" aria-labelledby="demo-title" className="texture-river-wide text-river-bright">
      <div className="mx-auto grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] items-center gap-12 px-6 py-18">
        <div data-reveal className="overflow-hidden rounded-paper bg-paper drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]">
          <DemoTankDrawing />
        </div>
        <div data-reveal="120" className="flex flex-col gap-4.5">
          <h2 id="demo-title" className="m-0 text-display leading-[1.08] font-normal text-balance">
            {t('home.demo.title')}
          </h2>
          <p className="m-0 max-w-[57ch] text-river-text">{t('home.demo.body')}</p>
          <div>
            <ButtonLink to="/demo" variant="amber" size="lg" iconEnd="arrowRight">
              {t('home.ctaDemo')}
            </ButtonLink>
          </div>
          <p className="m-0 font-mono text-label text-river-caption">{t('home.ctaNote')}</p>
        </div>
      </div>
    </section>
  )
}

/**
 * The Demo Tank as drawn: the still tank as an image, and its fish on top, the same size, swimming there and back.
 * The fish are written into the page rather than shown as an image, because only then does the browser apply the
 * visitor's "less motion" setting to them; for those visitors they stay still.
 */
function DemoTankDrawing() {
  return (
    <div className="grid">
      <Illustration slug="demo-tank" decorative className="[grid-area:1/1]" />
      <div aria-hidden className="[grid-area:1/1] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: demoTankFish }} />
    </div>
  )
}

/** Made-up points for the picture; the caption says so. */
const chartPath = 'M40 130 L82 105 L124 80 L166 120 L208 90 L250 55 L292 30 L334 105 L376 120 L418 90 L460 110 L502 100 L544 130'

function Idea() {
  const { t } = useTranslation()
  return (
    <section
      aria-labelledby="idea-title"
      className="mx-auto grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] items-center gap-14 px-6 pt-24 pb-10"
    >
      <div data-reveal className="flex flex-col gap-4.5">
        <h2 id="idea-title" className="m-0 text-display font-normal tracking-[-0.015em] text-balance">
          {t('home.idea.title')}
        </h2>
        <p className="m-0 max-w-[60ch] text-ink-soft">{t('home.idea.body')}</p>
      </div>
      <figure data-reveal="120" className={cx(plateClasses('md'), 'm-0')}>
        <PlateCorners items={[t('home.idea.chartLabel'), t('home.idea.chartRange')]} />
        <svg aria-hidden="true" viewBox="0 0 560 230" className="mt-2 block h-auto w-full">
          <path d={chartPath} fill="none" className="stroke-cardinal" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M262 206 L322 206" className="stroke-cardinal" strokeWidth="1.4" strokeDasharray="3 4" />
        </svg>
        <figcaption className="mt-1 flex flex-wrap justify-between gap-4">
          <Handwritten tone="red">{t('home.idea.chartNote')} ↑</Handwritten>
          <span className="self-end font-mono text-caption text-ink-muted">{t('home.idea.chartLegend')}</span>
        </figcaption>
      </figure>
    </section>
  )
}

const sample = [
  { key: 'temperature', value: 27.5 },
  { key: 'ph', value: 5.8 },
  { key: 'gh', value: 2 },
  { key: 'kh', value: 1 },
  { key: 'nitrite', value: 0 },
  { key: 'nitrate', value: 10 },
] as const

const features = ['tanks', 'measurements', 'maintenance', 'photos'] as const

function Features() {
  const { t } = useTranslation()
  const language = useLanguage()
  return (
    <section aria-labelledby="features-title" className="mx-auto max-w-site px-6 pt-14 pb-20">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3.5">
        <h2 id="features-title" className="m-0 text-display font-normal">
          {t('home.features.title')}
        </h2>
      </div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] border-l border-ink p-0">
        {features.map((feature, i) => (
          <li key={feature} data-reveal={i * 90} className="flex flex-col gap-3 border-r border-b border-ink px-6 pt-6.5 pb-7.5">
            <span aria-hidden="true" className="plate-corner">
              {t('ui.plate.fig')} {'ABCD'[i]}
            </span>
            <div aria-hidden="true" className="flex min-h-[150px] items-center justify-center">
              {feature === 'tanks' && <Illustration slug="blackwater" decorative />}
              {feature === 'measurements' && (
                <div className="grid grid-cols-3 gap-1.5">
                  {sample.map(({ key, value }) => (
                    <span key={key} className="flex flex-col gap-0.5 border border-ink/60 px-2 py-1.5 font-mono">
                      <span className="text-caption text-ink-muted">{t(`home.features.measurements.sample.${key}`)}</span>
                      <span className="text-lead text-ink">{formatNumber(value, language, { maxDecimals: 1 })}</span>
                    </span>
                  ))}
                </div>
              )}
              {feature === 'maintenance' && (
                <div className="flex gap-2.5">
                  <Stamp
                    tone="neon"
                    size="lg"
                    top={t('home.features.maintenance.waterChange.top')}
                    main="30%"
                    bottom={t('home.features.maintenance.waterChange.bottom')}
                    rotate={-12}
                  />
                  <Stamp tone="forest" size="md" main={t('home.features.maintenance.pruning')} rotate={8} />
                </div>
              )}
              {feature === 'photos' && (
                <Illustration slug="blackwater" decorative className="w-3/4 rotate-[-4deg] bg-paper-photo p-1.5 shadow-photo" />
              )}
            </div>
            <h3 className="m-0 text-h3 font-medium">{t(`home.features.${feature}.title`)}</h3>
            <p className="m-0 text-base text-ink-soft">{t(`home.features.${feature}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

const phases = [
  { number: 'I', key: 'p1', art: 'paracheirodon-axelrodi', ready: true },
  { number: 'II', key: 'p2', art: 'corydoras-adolfoi', ready: false },
  { number: 'III', key: 'p3', art: 'victoria-amazonica', ready: false },
  { number: 'IV', key: 'p4', art: 'apistogramma-agassizii', ready: false },
  { number: 'V', key: 'p5', art: 'echinodorus', ready: false },
] as const

function Roadmap() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="roadmap-title" className="mx-auto max-w-site px-6 pt-24 pb-18">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <h2 id="roadmap-title" className="m-0 text-display font-normal tracking-[-0.015em]">
            {t('home.roadmap.title')}
          </h2>
          <p className="m-0 max-w-[70ch] text-ink-soft">{t('home.roadmap.lead')}</p>
        </div>
        <Stamp tone="cardinal" size="xl" rotate={-10} main={t('home.roadmap.stamp')} />
      </div>
      <div className="relative mt-11">
        <svg aria-hidden="true" viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute top-1 left-0 h-10 w-full">
          <path
            d="M0 30 C120 10 200 50 320 30 S 540 8 660 30 S 900 52 1020 28 S 1160 18 1200 30"
            fill="none"
            className="stroke-water-white"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
        <ol className="relative m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-5.5 p-0">
          {phases.map((phase, i) => (
            <li key={phase.key} data-reveal={i * 90} className="flex flex-col gap-2.5">
              <span
                aria-hidden="true"
                className={cx(
                  'flex size-12.5 items-center justify-center rounded-full border-2 border-ink text-2xl italic',
                  phase.ready ? 'bg-cardinal text-paper-card' : 'bg-paper-card',
                )}
              >
                {phase.number}
              </span>
              <div aria-hidden="true" className="flex h-24 items-end">
                <Illustration slug={phase.art} decorative fit="contain" className="max-h-[92px] max-w-[86%]" />
              </div>
              <h3 className="m-0 text-h3 leading-[1.15] font-medium">{t(`home.roadmap.phases.${phase.key}.title`)}</h3>
              <p className="m-0 text-sm text-ink-soft">{t(`home.roadmap.phases.${phase.key}.body`)}</p>
              <span
                className={cx(
                  'self-start py-1 font-mono text-caption tracking-[0.1em] uppercase',
                  phase.ready ? 'bg-cardinal px-2 text-paper-card' : 'inline-flex items-center gap-1.5 text-ink-muted',
                )}
              >
                {!phase.ready && <span aria-hidden="true" className="size-2 rounded-full border border-current" />}
                {phase.ready ? t('home.roadmap.statusReady') : t('home.roadmap.statusPlanned')}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Why() {
  const { t } = useTranslation()
  return (
    <section
      aria-labelledby="why-title"
      className="mx-auto grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-14 px-6 pt-6 pb-28"
    >
      <div data-reveal>
        <Illustration
          slug="eichhornia-crassipes"
          decorative
          className="mx-auto max-w-[330px] [mask-image:linear-gradient(to_right,transparent,#000_22%,#000_78%,transparent)]"
        />
      </div>
      <figure
        data-reveal="120"
        className="relative m-0 rotate-[0.8deg] border border-ink/35 texture-card px-10 pt-10 pb-8.5 shadow-[0_14px_30px_rgb(36_26_17/0.18)]"
      >
        <Tape className="-top-3.5 left-1/2 -ml-15 w-30" />
        <h2 id="why-title" className="sr-only">
          {t('home.why.title')}
        </h2>
        <blockquote className="ruled m-0 font-hand text-h3 sm:text-h2 leading-[34px] text-ink-blue [background-size:100%_34px]">
          {t('home.why.body')}
        </blockquote>
        <figcaption className="mt-3.5 text-right font-hand text-h3 text-ink-blue">{t('home.why.signature')}</figcaption>
      </figure>
    </section>
  )
}

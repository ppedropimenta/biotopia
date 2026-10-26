import { useTranslation } from 'react-i18next'
import { pictures } from '../credits'

const logged = ['parameters', 'maintenance', 'photos'] as const

// Rows step down through the blackwater tones.
const rowTones = ['bg-tannin-2', 'bg-tannin-3', 'bg-tannin-2']

export function HomePage() {
  const { t } = useTranslation()

  return (
    <>
      <section className="grid items-end gap-10 px-5 pt-4 pb-24 sm:px-8 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="lg:pb-10">
          <h1 className="rise font-display text-[clamp(40px,5.4vw,88px)] leading-[0.98] tracking-[-0.02em]">
            {t('home.title')}
          </h1>
          <p className="rise mt-8 max-w-[34ch] text-[18px] leading-relaxed">{t('home.lead')}</p>
          <p className="rise mt-4 max-w-[34ch] text-[15px]">{t('home.status')}</p>
        </div>
        <figure className="settle">
          <div className="aspect-[4/3] overflow-hidden lg:aspect-auto lg:h-[72svh]">
            <img
              src={pictures.cachoeira.src}
              width={pictures.cachoeira.width}
              height={pictures.cachoeira.height}
              alt={t('home.hero.alt')}
              className="drift size-full object-cover object-[60%_50%]"
            />
          </div>
          <figcaption className="mt-3 font-display text-[18px] italic">{t('home.hero.caption')}</figcaption>
        </figure>
      </section>

      <section aria-labelledby="logged" className="bg-tannin text-on-tannin">
        <div className="grid lg:grid-cols-12">
          <figure className="rise lg:col-span-5">
            <img
              src={pictures.neon.src}
              width={pictures.neon.width}
              height={pictures.neon.height}
              alt={t('home.logged.neonAlt')}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover object-[30%_50%] lg:aspect-auto lg:h-full"
            />
            <figcaption className="sr-only">{t('home.logged.neonCaption')}</figcaption>
          </figure>
          <div className="lg:col-span-7">
            <h2 id="logged" className="rise px-5 pt-12 pb-8 font-display text-[30px] italic sm:px-8">
              {t('home.logged.title')}
            </h2>
            <ul>
              {logged.map((key, index) => (
                <li
                  key={key}
                  className={`rise grid gap-x-8 gap-y-2 px-5 py-8 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:px-8 ${rowTones[index]}`}
                >
                  <p className="font-display text-[clamp(56px,5.4vw,88px)] leading-[0.9] tracking-[-0.03em] text-neon">
                    {t(`home.logged.${key}.figure`)}
                  </p>
                  <div>
                    <h3 className="font-display text-[30px] leading-[1.1]">{t(`home.logged.${key}.label`)}</h3>
                    <p className="mt-2 max-w-[40ch] text-[18px] leading-relaxed">{t(`home.logged.${key}.note`)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p aria-hidden="true" className="px-5 py-4 font-display text-[18px] text-on-tannin-muted italic sm:px-8">
              {t('home.logged.neonCaption')}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="notes" className="grid items-center gap-10 px-5 py-28 sm:px-8 lg:grid-cols-12 lg:py-40">
        {/* The paper behind the plate matters: an animated parent isolates the multiply blend. */}
        <figure className="rise order-last bg-paper lg:order-first lg:col-span-7">
          <img
            src={pictures.geophagus.src}
            width={pictures.geophagus.width}
            height={pictures.geophagus.height}
            alt={t('home.notes.plateAlt')}
            loading="lazy"
            className="plate h-auto w-full"
          />
          <figcaption className="mt-2 font-display text-[18px] italic">{t('home.notes.plateCaption')}</figcaption>
        </figure>
        <div className="lg:col-span-5">
          <h2 id="notes" className="rise font-display text-[clamp(40px,5.4vw,88px)] leading-[0.98] tracking-[-0.02em]">
            {t('home.notes.title')}
          </h2>
          <p className="rise mt-6 max-w-[36ch] text-[18px] leading-relaxed">{t('home.notes.text')}</p>
        </div>
      </section>

      {/* Caption above the photo, so the band runs straight into the footer. */}
      <figure className="flex flex-col-reverse">
        <div className="h-[56svh] overflow-hidden lg:h-[78svh]">
          <img
            src={pictures.igapo.src}
            width={pictures.igapo.width}
            height={pictures.igapo.height}
            alt={t('home.notes.igapoAlt')}
            loading="lazy"
            className="size-full object-cover object-[50%_70%]"
          />
        </div>
        <figcaption className="px-5 pb-3 font-display text-[18px] italic sm:px-8">
          {t('home.notes.igapoCaption')}
        </figcaption>
      </figure>
    </>
  )
}

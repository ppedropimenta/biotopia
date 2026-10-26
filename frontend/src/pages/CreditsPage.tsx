import { useTranslation } from 'react-i18next'
import { pictures, type Picture } from '../credits'

export function CreditsPage() {
  const { t } = useTranslation()
  const all: Picture[] = Object.values(pictures)

  return (
    <div className="px-5 pt-10 pb-28 sm:px-8 lg:pt-16">
      <h1 className="rise font-display text-[clamp(40px,8vw,128px)] leading-[0.95] tracking-[-0.02em]">
        {t('credits.title')}
      </h1>
      <p className="rise mt-8 max-w-[46ch] text-[18px] leading-relaxed">{t('credits.intro')}</p>

      <section aria-labelledby="pictures" className="mt-24">
        <h2 id="pictures" className="rise -mx-5 bg-tannin px-5 py-8 font-display text-[30px] text-on-tannin italic sm:-mx-8 sm:px-8">
          {t('credits.pictures')}
        </h2>
        <ul className="mt-12 grid gap-x-10 gap-y-16 md:grid-cols-2">
          {all.map((picture) => (
            <li key={picture.sourceUrl} className="rise grid content-start gap-4">
              <img
                src={picture.src}
                width={picture.width}
                height={picture.height}
                alt=""
                loading="lazy"
                className="aspect-[3/2] w-full object-cover"
              />
              <h3 className="font-display text-[30px] leading-[1.1] italic">{picture.title}</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[15px]">
                <dt className="text-muted">{t('credits.by')}</dt>
                <dd>{picture.creator}</dd>
                <dt className="text-muted">{t('credits.licence')}</dt>
                <dd>
                  {picture.licenceUrl ? (
                    <a href={picture.licenceUrl} className="underline underline-offset-4 hover:no-underline">
                      {picture.licence}
                    </a>
                  ) : (
                    t('credits.publicDomain')
                  )}
                </dd>
                <dt className="text-muted">{t('credits.source')}</dt>
                <dd>
                  <a href={picture.sourceUrl} className="underline underline-offset-4 hover:no-underline">
                    Wikimedia Commons
                  </a>
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

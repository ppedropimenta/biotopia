import { useTranslation } from 'react-i18next'
import { fonts, pictures, type Credit, type Picture } from '../credits'
import { cx } from '../lib/cx'
import { PageHeader, SectionHeader } from '../components/ui/Structure'

const fontClass: Record<string, string> = { 'Source Serif 4': 'font-serif', 'IBM Plex Mono': 'font-mono', Caveat: 'font-hand' }

export function CreditsPage() {
  const { t } = useTranslation()
  const pictureList: Picture[] = Object.values(pictures)

  return (
    <div className="mx-auto flex max-w-site flex-col gap-12 px-6 pt-10 pb-24">
      <PageHeader title={t('credits.title')} subtitle={t('credits.intro')} />

      <section aria-labelledby="fonts" className="flex flex-col gap-6">
        <SectionHeader title={<span id="fonts">{t('credits.fonts')}</span>} />
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-7 p-0">
          {Object.values(fonts).map((font) => (
            <li key={font.title} className="flex flex-col gap-3 border border-ink/35 texture-card px-5 py-5">
              <h3 className={cx('m-0 text-h2 leading-[1.1] font-normal', fontClass[font.title])}>{font.title}</h3>
              <CreditDetails credit={font} />
            </li>
          ))}
        </ul>
      </section>

      {pictureList.length > 0 && (
        <section aria-labelledby="pictures" className="flex flex-col gap-6">
          <SectionHeader title={<span id="pictures">{t('credits.pictures')}</span>} />
          <ul className="m-0 grid list-none gap-x-10 gap-y-12 p-0 md:grid-cols-2">
            {pictureList.map((picture) => (
              <li key={picture.sourceUrl} className="grid content-start gap-4">
                <img
                  src={picture.src}
                  width={picture.width}
                  height={picture.height}
                  alt=""
                  loading="lazy"
                  className="aspect-[3/2] w-full object-cover"
                />
                <h3 className="m-0 text-h3 font-medium italic">{picture.title}</h3>
                <CreditDetails credit={picture} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function CreditDetails({ credit }: { credit: Credit }) {
  const { t } = useTranslation()
  return (
    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
      <dt className="label-mono text-ink-muted">{t('credits.by')}</dt>
      <dd className="m-0">{credit.creator}</dd>
      <dt className="label-mono text-ink-muted">{t('credits.licence')}</dt>
      <dd className="m-0">
        {credit.licenceUrl ? (
          <a href={credit.licenceUrl}>{credit.licence}</a>
        ) : credit.licence === 'Public domain' ? (
          t('credits.publicDomain')
        ) : (
          credit.licence
        )}
      </dd>
      <dt className="label-mono text-ink-muted">{t('credits.source')}</dt>
      <dd className="m-0">
        <a href={credit.sourceUrl}>{credit.sourceName}</a>
      </dd>
    </dl>
  )
}

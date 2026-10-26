import type { ReactNode } from 'react'
import type { Picture } from '../credits'

type Props = {
  title: string
  lead?: string
  picture: Picture
  pictureAlt: string
  pictureCaption: string
  /** CSS object-position, to keep the interesting part of the photo in view when it is cropped. */
  pictureFocus?: string
  children?: ReactNode
}

/**
 * The frame for sign-up, login and email confirmation: the form on a blackwater field, a river photograph
 * beside it. On a phone the form comes first and the photograph follows.
 */
export function AuthScreen({ title, lead, picture, pictureAlt, pictureCaption, pictureFocus = '50% 50%', children }: Props) {
  return (
    <div className="grid lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-12">
      <section className="flex flex-col justify-center bg-tannin px-5 py-14 text-on-tannin sm:px-8 lg:col-span-5 lg:py-20">
        <h1 className="rise font-display text-[clamp(40px,4.4vw,72px)] leading-[0.98] tracking-[-0.02em] italic">
          {title}
        </h1>
        {lead && <p className="rise mt-5 max-w-[34ch] text-[18px] leading-relaxed">{lead}</p>}
        <div className="rise mt-10 max-w-[28rem]">{children}</div>
      </section>
      {/* Caption above the photo, so the photograph runs straight into the footer (as on the home page). */}
      <figure className="flex flex-col-reverse lg:col-span-7">
        <div className="relative min-h-[40svh] flex-1 overflow-hidden">
          <img
            src={picture.src}
            width={picture.width}
            height={picture.height}
            alt={pictureAlt}
            style={{ objectPosition: pictureFocus }}
            className="settle absolute inset-0 size-full object-cover"
          />
        </div>
        <figcaption className="px-5 py-3 font-display text-[18px] italic sm:px-8">{pictureCaption}</figcaption>
      </figure>
    </div>
  )
}

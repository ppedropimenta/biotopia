// Everything on the site made by someone else. The credits page renders these lists, so a font or a
// picture cannot be added without its credit. Titles are the ones on the source page. The drawn fish,
// plants and tanks were made for this project and are not listed.
export type Credit = {
  title: string
  creator: string
  licence: string
  licenceUrl?: string
  sourceUrl: string
  /** The name of the site the source link goes to. */
  sourceName: string
}

export type Picture = Credit & {
  src: string
  width: number
  height: number
}

const openFontLicence = {
  licence: 'SIL Open Font Licence 1.1',
  licenceUrl: 'https://openfontlicense.org/open-font-license-official-text/',
  sourceName: 'Google Fonts',
}

export const fonts = {
  fraunces: {
    title: 'Fraunces',
    creator: 'Undercase Type',
    sourceUrl: 'https://fonts.google.com/specimen/Fraunces',
    ...openFontLicence,
  },
  dmMono: {
    title: 'DM Mono',
    creator: 'Colophon Foundry',
    sourceUrl: 'https://fonts.google.com/specimen/DM+Mono',
    ...openFontLicence,
  },
  caveat: {
    title: 'Caveat',
    creator: 'Impallari Type',
    sourceUrl: 'https://fonts.google.com/specimen/Caveat',
    ...openFontLicence,
  },
} satisfies Record<string, Credit>

// No third-party pictures right now. A picture goes here with its licence and its source.
export const pictures = {} satisfies Record<string, Picture>

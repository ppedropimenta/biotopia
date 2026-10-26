import cachoeira from './assets/cachoeira-das-lajes.jpg'
import geophagus from './assets/geophagus-obscurus.jpg'
import igapo from './assets/igapo-rio-negro.jpg'
import neon from './assets/neon-tetra.jpg'

// Everything on the site made by someone else. The credits page renders this list,
// so a picture cannot be added without its credit. Titles are the ones on the source page.
export type Picture = {
  src: string
  width: number
  height: number
  title: string
  creator: string
  licence: string
  licenceUrl?: string
  sourceUrl: string
}

export const pictures = {
  cachoeira: {
    src: cachoeira,
    width: 1920,
    height: 1272,
    title: 'Cachoeira das Lajes, Presidente Figueiredo (AM)',
    creator: 'MTur Destinos',
    licence: 'Public domain',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:MarioOliviera_Cachoeira_das_Lajes_Presidente_Figueiredo_AM_(41150589461).jpg',
  },
  neon: {
    src: neon,
    width: 1920,
    height: 1272,
    title: 'Neonsalmler Paracheirodon innesi',
    creator: 'Holger Krisp',
    licence: 'CC BY 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/3.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Neonsalmler_Paracheirodon_innesi.jpg',
  },
  geophagus: {
    src: geophagus,
    width: 1410,
    height: 836,
    // The species name printed on Castelnau's 1856 plate, not the current name.
    title: 'Geophagus obscurus',
    creator: 'Francis de Castelnau, 1856',
    licence: 'Public domain',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Castelnau-poissons_Geophagus_obscurus.jpg',
  },
  igapo: {
    src: igapo,
    width: 1920,
    height: 1080,
    title: 'Igapó no Rio Negro com Vitórias-Régias',
    creator: 'José Renato Venâncio Resende',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Igap%C3%B3_no_Rio_Negro_com_Vit%C3%B3rias-R%C3%A9gias.jpg',
  },
} satisfies Record<string, Picture>

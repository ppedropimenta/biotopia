/**
 * The drawn illustrations. The key is a stable slug. `width` and `height` are the original viewBox, used
 * to reserve the space and avoid a layout jump. Drawings are static SVG files made for this project.
 *
 * To add one: save the SVG in assets/illustrations/ and add a line here. The kit that drew these has
 * more (other fish, plants, a basin map); copy them when a screen needs them.
 */
import tankBlackwater from '../assets/illustrations/tanks/blackwater.svg'
import tankPlanted from '../assets/illustrations/tanks/planted.svg'
import tankPlantedDiscus from '../assets/illustrations/tanks/planted-discus.svg'
import apistogramma from '../assets/illustrations/fish/apistogramma-agassizii.svg'
import cardinal from '../assets/illustrations/fish/cardinal.svg'
import corydoras from '../assets/illustrations/fish/corydoras-adolfoi.svg'
import discus from '../assets/illustrations/fish/discus.svg'
import echinodorus from '../assets/illustrations/plants/echinodorus.svg'
import floatingPlants from '../assets/illustrations/plants/floating-plants.svg'
import folhas from '../assets/illustrations/plants/folhas.svg'
import waterHyacinth from '../assets/illustrations/plants/eichhornia-crassipes.svg'
import vitoriaRegia from '../assets/illustrations/plants/vitoria-regia.svg'

export type Art = { src: string; width: number; height: number }

const art = (src: string, width: number, height: number): Art => ({ src, width, height })

/** Fish, by the slug of the scientific name. */
export const fishArt = {
  'paracheirodon-axelrodi': art(cardinal, 420, 170),
  'symphysodon-aequifasciatus': art(discus, 380, 330),
  'apistogramma-agassizii': art(apistogramma, 420, 200),
  'corydoras-adolfoi': art(corydoras, 380, 210),
} as const

/** Plants, by the slug of the scientific name; other plant drawings (dry leaves) by a plain name. */
export const plantArt = {
  'victoria-amazonica': art(vitoriaRegia, 520, 250),
  'echinodorus': art(echinodorus, 400, 400),
  'eichhornia-crassipes': art(waterHyacinth, 340, 440),
  'folhas-secas': art(folhas, 280, 190),
} as const

/** Decorations that are not a species: a strip of floating plants for the top of a page, full width. */
export const decorationArt = {
  'floating-plants': art(floatingPlants, 1400, 150),
} as const

/** Tank drawings, used until a tank has photos. */
export const tankArt = {
  blackwater: art(tankBlackwater, 540, 360),
  planted: art(tankPlanted, 540, 360),
  'planted-discus': art(tankPlantedDiscus, 540, 360),
} as const

const tankDrawings = Object.keys(tankArt) as Array<keyof typeof tankArt>

/**
 * The drawing for a tank: the drawings take turns by plate number, so neighbouring plates never look alike. A tank
 * with no plate number (the Demo Tank, which is not in the visitor's list) gets the first one.
 */
export function tankDrawing(plateNumber: number | null): keyof typeof tankArt {
  if (plateNumber === null) return tankDrawings[0]
  return tankDrawings[(plateNumber - 1) % tankDrawings.length]
}

/** Looks a slug up in every group; undefined when there is no drawing (show the FishPlaceholder). */
export function findArt(slug: string): Art | undefined {
  const all: Record<string, Art> = { ...fishArt, ...plantArt, ...tankArt, ...decorationArt }
  return all[slug]
}

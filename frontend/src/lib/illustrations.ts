/**
 * The drawn illustrations. The key is a stable slug. `width` and `height` are the original viewBox, used
 * to reserve the space and avoid a layout jump. Drawings are static SVG files made for this project.
 *
 * To add one: save the SVG in assets/illustrations/ and add a line here. The kit that drew these has
 * more (other fish, plants, a basin map); copy them when a screen needs them.
 */
import tankBlackwater from '../assets/illustrations/tanks/blackwater.svg'
import cardinal from '../assets/illustrations/fish/cardinal.svg'
import discus from '../assets/illustrations/fish/discus.svg'

export type Art = { src: string; width: number; height: number }

const art = (src: string, width: number, height: number): Art => ({ src, width, height })

/** Fish, by the slug of the scientific name. */
export const fishArt = {
  'paracheirodon-axelrodi': art(cardinal, 420, 170),
  'symphysodon-aequifasciatus': art(discus, 380, 330),
} as const

/** Tank drawings, used until a tank has photos. */
export const tankArt = {
  blackwater: art(tankBlackwater, 540, 360),
} as const

/** Looks a slug up in every group; undefined when there is no drawing (show the FishPlaceholder). */
export function findArt(slug: string): Art | undefined {
  const all: Record<string, Art> = { ...fishArt, ...tankArt }
  return all[slug]
}

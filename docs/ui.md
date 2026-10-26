# UI

How the app looks, and the few rules that keep new screens consistent. The values live in
`frontend/src/index.css`; components use them through Tailwind classes (`bg-paper`, `bg-tannin`,
`text-neon`, `font-display`), never as raw colours or sizes.

## Priorities

- Two audiences count equally: fishkeepers who log every week, and first-time visitors who open the
  demo tank without an account.
- Phone and desktop count equally. Logging usually happens on a phone next to the tank; charts are read
  on a bigger screen.
- The tank page is the most important screen. It is also what the demo tank shows.
- It should feel like fishkeeping and river life, with colour, not like a generic blog.
- The app is built around freshwater tanks, but the interface does not shut anyone out: no "freshwater
  only" wording on the pages.

## The idea

Two worlds side by side. An old naturalist's notebook: aged paper, brown ink, a hand-coloured plate,
a book serif. And a blackwater river: tea-dark fields, real photographs of the Amazon, and the neon
tetra's blue on the figures. Plates are used sparingly, as a touch of the notebook, not as a gallery.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#ece6d6` | Page ground (aged paper) |
| `paper-deep` | `#e2dac5` | Controls and panels on paper |
| `ink` | `#24170e` | All running text on paper; the primary action |
| `muted` | `#5c4a3a` | Labels only, never running text |
| `tannin`, `tannin-2`, `tannin-3` | `#24130a`, `#301a0d`, `#3d2211` | Blackwater fields, stepping in tone |
| `on-tannin` / `on-tannin-muted` | `#f3e6cc` / `#cdb491` | Text and secondary notes on blackwater |
| `neon` | `#3fe0e6` | Figures and highlights on blackwater only |
| `neon-red` | `#ff5a47` | A value that needs attention, on blackwater |
| `positive` / `negative` / `warning` | green / red / amber | Status on paper, never decoration |

The paper is deliberately warm. The design tooling flags cream grounds as a generated-page cliché; here
it is a choice, because aged paper is the point.

## Type

- **Newsreader** for titles, names, big figures and captions. Captions and titles on blackwater are
  italic.
- **Instrument Sans** for running text, labels, controls and numbers in tables (tabular figures).
- Five sizes do the work: 15 (labels), 18 (text), 30 (small titles), a display size up to 88 and the
  footer name.
- Both fonts are self-hosted (Fontsource), so visitors' browsers never call a third-party font server.

## Shapes

- Square corners everywhere: photos, plates, fields, controls.
- No shadows on things at rest, no gradients, no thin divider lines between sections. Surfaces change
  by a step in tone, or by a whole blackwater field.
- Sentence case everywhere. No small uppercase labels above headings.

## Pictures

- Real pictures only: photographs of rivers and fish, and old plates. Every one has a caption that says
  what it is.
- Plates blend into the paper with `mix-blend-mode: multiply`; their figure has the paper background
  behind it, because an animated parent isolates blending.
- Every picture made by someone else goes in `frontend/src/credits.ts`, which the credits page renders.
- The demo tank's own photos will take the lead once they exist.

## Layout

- One pair of side margins on every page: 20px on a phone, 32px from 640px up.
- Every page has one `h1` and a heading on every section.
- Neighbouring sections change composition and ground: paper, then blackwater, then paper, then a
  full-width photograph.
- The footer is a blackwater field with the name set large.

## Motion

Parts of a section rise into place once, in reading order (`rise`); a lead picture settles in from
slightly larger (`settle`); the hero river photo drifts very slowly (`drift`). Only transform and
opacity animate, and nothing moves when the visitor asks for reduced motion.

## Account screens

Sign up, log in and email confirmation share one frame (`frontend/src/auth/AuthScreen.tsx`): the form on a
blackwater field, a river photograph beside it, the photograph's caption above it so the picture runs
straight into the footer. On a phone the form comes first, then the photograph.

- Fields are a step lighter than the field they sit on (`tannin-3`), with the label above in `on-tannin-muted`.
  No outlined boxes.
- The one filled action on blackwater is `neon` on `tannin`; on paper it is `ink` on `paper`.
- Messages come from the API as codes and are written in the chosen language. Forms use `noValidate` so the
  browser's own validation messages (in the browser's language) never appear.
- The header on a phone holds only the name, Log in (or Log out) and the language; Sign up is offered on the
  home page and on the login page. The language list says "Português", not "Português (Brasil)", to fit.
- These are working screens with one photograph, so the landing-page rules (a minimum number of pictures,
  a motion count) do not apply to them. The remaining judgement calls are the same choices as elsewhere:
  warm paper, a large title for a first visit, and the form centred in a full-height field.

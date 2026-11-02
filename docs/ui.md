# UI

How the app looks, and the few rules that keep new screens consistent. The values live in
`frontend/src/styles/biotopia.css`; components use them through Tailwind classes (`bg-paper`, `text-ink`,
`font-serif`, `shadow-plate`), never as raw colours or sizes. The shared pieces are in
`frontend/src/components/ui` and `frontend/src/components/layout`; in a development build, `/dev/kit` shows
all of them on one page.

## Priorities

- Two audiences count equally: fishkeepers who log every week, and first-time visitors who read the landing
  page and, once it exists, open the Demo Tank without an account.
- Phone and desktop count equally. Logging usually happens on a phone next to the tank, so the measurement
  form is designed for a narrow screen first. Charts are read on a bigger screen.
- The tank page is the most important screen. It is also what the Demo Tank shows.
- It should feel like fishkeeping and river life, with colour and drawn animals and plants, not like a
  generic dashboard.
- The interface does not shut anyone out: no wording on the pages says the app is for only one kind of tank.

## The idea

A field notebook of a blackwater stream. The pages are aged paper written in sepia ink. Each tank is a
numbered plate, like the plates of a naturalist's book, with a drawn tank on it. Fish and plants are drawn
in the same hand. Around the pages is the stream itself: the side menu and the public header are
tea-dark water with the lines of tributaries running through it. Handwriting appears only where the
keeper "wrote" something.

## Colour

Colours have roles. Use the role, not the shade you like.

| Role | Tokens | Use |
| --- | --- | --- |
| Paper | `paper`, `paper-card`, `paper-photo` | Page ground, plates and fields, polaroid frames and labels |
| Ink | `ink`, `ink-soft`, `ink-muted` | Running text and borders; supporting text; labels and metadata. Muted is never running text |
| Handwriting | `ink-blue` | Notes the keeper wrote |
| Blackwater | `blackwater` and `river-*` | Side menu, public header, dark bands and the dark header of the measurement form |
| Amber | `amber`, `amber-soft` | The main action on blackwater, the brand's second line, highlights on dark |
| Cardinal | `cardinal` | Out of range, errors and alerts. Nothing else |
| Forest, ochre | `forest`, `ochre` | Good or neutral status; warnings. Never decoration |

The contrast of a token on its ground is noted next to the token in `biotopia.css`. Status never depends on colour
alone: a symbol or a word goes with it (▲ ▼ =, "Not measured").

## Type

- **Fraunces** for titles, names, running text and captions.
- **IBM Plex Mono** for data: field and parameter names, numbers, dates, table headers, buttons and the brand
  line.
- **Caveat** for handwriting only: a note the keeper wrote, the "start a new plate" hint, the note on the
  landing page.
- Self-hosted through Fontsource, so a visitor's browser never calls a third-party font server. The fonts
  and their licence are on the credits page.
- Capitals are a CSS transform. The text in the translation files and in the page stays in normal case, so
  screen readers and tests read it normally.
- Numbers and dates follow the language of the page (decimal comma in Portuguese).

## Shapes

- Corners are almost square (2px): buttons, fields, cards.
- Plates have a double rule inside the border and a soft shadow; polaroids have a frame and a shadow. A
  plate or a note may sit a degree or two off level. Other shadows are only for things lifted off the page,
  such as the plates of the landing hero.
- Cards sit on paper with a thin ink border. Dashed borders mean "add" or "optional".
- Small uppercase mono labels belong to data and controls: field names, parameter names, plate headers
  ("Plate I · Fig. 1"), table headers, buttons and the brand line. They are never a line above a heading:
  a heading stands on its own.

## Pictures

- Drawn illustrations: fish, plants and tanks, in `frontend/src/assets/illustrations`, found by slug in
  `frontend/src/lib/illustrations.ts`. They were made for this project and are not credited.
- A tank has the same drawn tank until it has photos of its own.
- A drawing of a species is named by its scientific name (in the caption or the `alt`). A decorative
  drawing has an empty `alt`.
- Show only data that exists. A chart or value drawn for illustration says that it is an example.
- Every picture made by someone else goes in `frontend/src/credits.ts`, which the credits page renders.

## Logo

- The symbol is a fallen leaf that is also a fish: the Amazon leaffish (*Monocirrhus polyacanthus*), which
  hides in blackwater by looking like a dead leaf adrift. It was made for this project and is not credited.
- In the app it is amber on blackwater (`BrandSymbol` in `frontend/src/components/ui/Brand.tsx`), always
  before the name in Fraunces italic. Only the side menu adds the tagline in mono under the name; the public
  header and the account screens show the symbol and the name alone.
- The favicon and the app icons (`frontend/public`) are the symbol on a blackwater square. Under 24px the
  side veins go away.
- One colour only, from the palette. Never `cardinal`, and no shadow or outline.

## Layout

- Logged in: a 248px blackwater side menu with the tanks, the current tank's overview and the main action
  "Log measurement". The foot has the account email, Credits, Log out and the PT / EN switch. Below 768px the
  menu is a strip at the top with a Menu button. The menu links only to screens that exist.
- Public pages: a blackwater header with the brand, PT / EN and Log in, a paper body up to 1200px wide, and
  a blackwater footer with the credits link.
- A page starts with one `h1`; every section has a heading. A "Skip to content" link comes first.
- Touch targets are at least 44px high.

## Motion

Nothing moves on its own. Buttons and links change colour on hover and focus. If something animates later,
it uses only transform and opacity and stops when the visitor asks for reduced motion.

## Account screens

Log in and sign up are one screen with a switch between the two, and each keeps its own address. The
email confirmation, forgot password and reset password pages use the same frame
(`frontend/src/auth/AuthScreen.tsx`): a blackwater panel with a plate of a giant water lily on the left,
the form on paper on the right. On a phone the plate gives way to a dark strip and the form comes first.

- "Keep me logged in" is ticked by default; unticked, the session ends when the browser closes.
- "Forgot my password" shows on the log in side only.
- Messages come from the API as codes and are written in the chosen language, under the field they are
  about. Forms use `noValidate` so the browser's own validation messages (in the browser's language) never
  appear.

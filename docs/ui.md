# UI

How the app looks, and the rules that keep new screens consistent with the old ones. The values live in
`frontend/src/styles/biotopia.css`. Components reach them through Tailwind classes (`bg-paper`, `text-ink`,
`font-serif`, `shadow-plate`) and never use a raw colour or size. Shared pieces are in
`frontend/src/components/ui` and `frontend/src/components/layout`; a development build shows all of them on
one page at `/dev/kit`.

## Priorities

- Two kinds of people matter as much as each other: fishkeepers who log every week, and visitors who read the
  landing page and open the Demo Tank without an account.
- So do phones and computers. Logging usually happens on a phone next to the tank, so the measurement form is
  designed for a narrow screen first. Charts are easier to read on a bigger one.
- The tank page is the most important screen, and it is also what the Demo Tank shows.
- The app should feel like fishkeeping and river life, with colour and drawn fish and plants. A generic
  dashboard is what it should not look like.
- No text on the pages says the app is only for one kind of tank.

## The idea

The app is a field notebook kept beside a blackwater stream. Pages are aged paper written in sepia ink. Each
tank is a numbered plate, like the plates in an old naturalist's book, and fish and plants are drawn in the same
hand. Around the pages runs the stream: the side menu, the public header and the footer are tea-coloured water
with the lines of its tributaries. Handwriting shows up only where the keeper "wrote" something.

## Colour

Each colour has a job, and a new screen picks colours by job.

| Role | Tokens | Used for |
| --- | --- | --- |
| Paper | `paper`, `paper-card`, `paper-photo` | The page, plates and fields, polaroid frames and labels |
| Ink | `ink`, `ink-soft`, `ink-muted` | Running text and borders; supporting text; labels and metadata (never running text) |
| Handwriting | `ink-blue` | Notes the keeper wrote |
| Blackwater | `blackwater` and `river-*` | Side menu, public header and footer, dark bands, the header of the measurement form |
| Amber | `amber`, `amber-soft` | The main action on a dark ground, and highlights there |
| Cardinal | `cardinal` | Out of range, errors and alerts, and nothing else |
| Forest, ochre | `forest`, `ochre` | Good or neutral status, and warnings. Not for decoration |

Each token's contrast on its ground is written next to it in `biotopia.css`. Status never relies on colour
alone; a symbol or a word goes with it (▲ ▼ =, "Not measured").

## Type

- **Source Serif 4** sets titles, names, running text and captions, with its optical sizes on.
- **IBM Plex Mono** sets data and controls: field and parameter names, numbers, dates, table headers and
  buttons.
- **Caveat** is only for handwriting: a note the keeper wrote, the hint on a blank plate, the note on the
  landing page.

The fonts are self-hosted through Fontsource, so a visitor's browser never calls a font server, and their
licence is on the credits page.

Sizes come from one scale (12, 14, 16, 20, 24, 32 and 48px) plus the hero title, which goes from 36 to 80px
and shrinks on narrow phones so its second line always fits. Text widths are set in `ch`, which follows the
width of the serif's zero; a change of typeface changes every measure, so check them after one.

Capitals are a CSS transform: the text in the translation files and in the page stays in normal case, and
screen readers and tests read it as written. Numbers and dates follow the language of the page (a decimal
comma in Portuguese). Paragraphs use `text-wrap: pretty`, so a last line is never a single word.

## Shapes

- Corners are almost square (2px) on buttons, fields and cards.
- Plates have a double rule inside the border and a soft shadow, and polaroids have a frame and a shadow. A
  plate or a note may sit a degree or two off level. Other shadows are for things lifted off the page, like
  the plates in the landing hero.
- Cards sit on paper with a thin ink border. A dashed border means "add" or "optional".
- Small uppercase mono labels belong to data and controls: field and parameter names, plate headers
  ("Plate I · Fig. 1"), table headers and buttons. A heading never has one above it.

## Pictures

- The drawn fish, plants and tanks are in `frontend/src/assets/illustrations` and are found by slug through
  `frontend/src/lib/illustrations.ts`. They were made for this project and are not credited.
- A tank shows a drawn tank until it has photos of its own.
- A drawing of a species is named by its scientific name, in the caption or the `alt`. A decorative drawing
  has an empty `alt`.
- Only data that exists is shown. A chart or a value drawn as an illustration says it is an example.
- Every picture made by someone else is listed in `frontend/src/credits.ts`, which the credits page shows.

## Logo

- The symbol is a dead leaf that is also a fish: the Amazon leaffish (*Monocirrhus polyacanthus*), which hides
  in blackwater by looking like a leaf adrift. It was made for this project and is not credited.
- In the app it is amber on blackwater (`BrandSymbol` in `frontend/src/components/ui/Brand.tsx`), always
  before the name in Source Serif 4 italic. Every screen shows the symbol and the name alone.
- The favicon and the app icons (`frontend/public`) are the symbol on a blackwater square. Below 24px the side
  veins go.
- It is always one colour from the palette, never `cardinal`, with no shadow or outline.

## Layout

Logged in, the screens have a blackwater side menu 248px wide. It holds the brand, a link to My tanks and, when
a tank is in view, its sections and the record buttons ("+ Measurement" in amber and "+ Maintenance"). Account,
Credits and Log out sit at the foot. From 808px up it stays in place while the page scrolls.
Below 768px it becomes a bar fixed at the top, with a Menu button and the record buttons side by side. The menu
links only to screens that exist.

Public pages have a blackwater header with the brand, the Demo Tank link, the PT / EN switch (only for visitors
who are not logged in) and Log in or My tanks. The body is paper up to 1200px wide, and a blackwater footer
carries the credits link. Logged-in users change the language on the Account page.

Every page starts with one `h1` and every section has a heading. A "Skip to content" link comes first, and
touch targets are at least 44px high.

## Motion

Motion is small and only uses opacity and position, never layout. Everything is in `biotopia.css`:

- `rise`: a block fades in and moves up as the page opens, as in the landing hero. Parts of one block can be
  staggered with `--rise-delay`.
- Reveal: sections lower on the landing page do the same when they scroll into view (`useReveal` and
  `data-reveal`). Content that was never revealed stays visible if the script does not run.
- `sway`: the floating plants at the top of the landing page drift slowly.
- `swim`: the fish in a drawn tank swim a little back and forth.

When the visitor's system asks for less motion, the endless ones (`sway`, `swim`) do not run and the others
finish at once. Buttons and links only change colour on hover and focus.

## Account screens

Log in and sign up are one screen with a switch between them, and each keeps its own address. Email
confirmation, forgot password and reset password use the same frame (`frontend/src/auth/AuthScreen.tsx`): a
blackwater panel with a plate of a giant water lily on the left and the form on paper on the right. On a phone
the plate becomes a dark strip and the form comes first.

- "Keep me logged in" is ticked by default. Unticked, the session ends when the browser closes.
- "Forgot my password" shows only on the log in side, and the PT / EN switch only on the sign up side.
- Messages come from the API as codes and are written in the chosen language, under the field they are about.
  Forms use `noValidate`, so the browser's own messages (in the browser's language) never appear.

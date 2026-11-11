# studio.zhoucai.me: photography portfolio (design spec)

Date: 2026-11-11
Status: draft, awaiting review

## Goal

A photography portfolio on its own subdomain of zhoucai.me, with a way to ask for prints.
It should feel like Ryan McGinley's site (one photo at a time, click to advance, collections
in a side list) and make it easy to add new collections over time, especially fashion work
the user plans to shoot.

Success means:

- `https://studio.zhoucai.me` is live, served over HTTPS from GitHub Pages.
- A visitor can pick a collection, click or arrow through every photo, open a thumbnail grid,
  and send a print request for the photo on screen.
- It works at phone width (375px) with no horizontal scroll.
- Adding a collection is: copy photos into a folder on the T7, run one command, commit, push.

## Decisions already made

| Topic | Decision |
|---|---|
| Look | Mockup "B · Collections" (canvas https://claude.ai/artifact/2NFCEBZJy3Lw4o3pu4MhNo) |
| Print sales | Inquiry only. "Request this print" opens a pre-filled email. No checkout yet. |
| Subdomain | `studio.zhoucai.me` |
| Photo source | `/Volumes/T7/2-Selects/Portfolio/<NN-Collection-Name>/` on the T7 drive |
| Stack | Vite + React + TypeScript, set up like `zhoucaiNi/radio` |
| Hosting | Own repo `zhoucaiNi/studio`, GitHub Actions deploys `main` to Pages |
| Off limits | Nothing from `2-Selects/Helen Edits (Berlin, Cali)`, ever |

## Out of scope

Checkout and payments, print-on-demand, a CMS or admin page, analytics, per-photo prices,
dark mode, and a link from zhoucai.me's nav (a small follow-up PR on that repo once this is live).

## Content pipeline

### Source folder on the T7

```
/Volumes/T7/2-Selects/Portfolio/
  01-Open-Country/
    01.jpg  02.jpg  ...        copies of chosen photos (any file names)
    info.json                  optional: alt text and captions
  02-Dusk/
  03-San-Francisco/
  04-Shoe-Rotations/
  05-Fall/
```

- The numeric prefix sets the collection order; the rest of the folder name (hyphens to spaces)
  is the display name, and its lowercase form is the URL slug (`open-country`).
- Photos inside a collection are ordered by file name.
- These are copies. Originals stay where they are; this follows the T7 rule that cross-shoot
  curated sets live in `2-Selects`.
- `info.json` (optional) maps file name to `{ "alt": "...", "caption": "..." }`. Missing alt
  falls back to `"<Collection>, photo N"`; missing caption falls back to empty.

Initial content is the 27 photos from the mockup (from `2024 Best Photos` and `IG Worthy`),
copied into five collections. The copy is shown as a dry run and only done after approval.

### Export script: `npm run photos`

`scripts/export-photos.ts`, run with Node on the user's Mac. Uses `sharp`.

For each collection folder and each `.jpg/.jpeg/.png` file in it (other files, including
`.heic`, which sharp's prebuilt binaries can't read, are skipped with a warning naming them):

1. Refuse to run if the source root or any file path contains `Helen Edits`.
2. Apply EXIF rotation, then strip all metadata (GPS, camera serials, dates).
3. Write `public/photos/<slug>/<NN>-full.jpg` (long edge 2000px, quality 82) and
   `public/photos/<slug>/<NN>-thumb.jpg` (long edge 600px, quality 75).
4. Record width and height of the full image.

Then write `src/data/collections.json`:

```json
[
  {
    "slug": "open-country",
    "name": "Open Country",
    "photos": [
      { "full": "/photos/open-country/01-full.jpg", "thumb": "/photos/open-country/01-thumb.jpg",
        "width": 2000, "height": 1126, "alt": "A herd of bison grazing on green hills", "caption": "2024" }
    ]
  }
]
```

The script deletes and rewrites `public/photos/` each run so removed photos disappear.
Photos are committed to the repo (27 photos at roughly 300 KB each is well under Pages limits).
The source root defaults to `/Volumes/T7/2-Selects/Portfolio` and can be overridden with
`PORTFOLIO_DIR` for tests.

## Site

### Layout (desktop, from mockup B)

- Background `#f4f2ee` (paper), text `#1a1a1a`, muted `#5f5b55` (6.3:1 on paper).
- Fonts: IBM Plex Sans for text, IBM Plex Mono for counters and labels (Google Fonts).
- Left column (about 240px): name "Zhoucai Ni" linking to zhoucai.me, the collection list with
  photo counts, then Prints, Info and Instagram links.
- Main area: the current photo, scaled to fit about 78% of the viewport height, never cropped.
  Below it: `Collection · caption`, `prev`, `03 / 07`, `next`, `show thumbnails`.
- Print section below that, then the footer (San Francisco, email, zhoucai.me).

At phone width the left column stacks above the photo, the collection list wraps into a row,
and the photo fits the screen width.

### Behavior

- Clicking the photo shows the next one. `prev` and `next` wrap around.
- Left and right arrow keys move back and forward. Keys are ignored while focus is in a text field.
- `show thumbnails` swaps the photo for a grid of the collection's thumbnails; clicking one opens
  it and closes the grid. Escape also closes the grid.
- Choosing a collection jumps to its first photo.
- The URL follows the view: `#/open-country/3` (1-based). Loading a URL opens that photo;
  an unknown slug or number falls back to the first collection's first photo. Back and forward
  buttons work.
- The next photo's full image is preloaded so clicks feel instant.
- With `prefers-reduced-motion`, no fades; otherwise a short fade (150ms) between photos.

### Print request

- Size buttons: 8×10, 11×14, 16×20, 24×30 in. One is selected (default 11×14).
- Copy: "Archival pigment prints, made to order. Pick a size and send a request; I'll reply
  with a price and timing."
- "Request this print" is a `mailto:` link to the contact email, with subject
  `Print request: <Collection> <NN>` and a body naming the collection, photo number, size and
  the photo's URL.
- The contact email and Instagram handle live in one config file, `src/config.ts`.

### Accessibility

Real `<button>` and `<a>` elements, visible focus ring, every photo has alt text, the current
collection has `aria-current`, the counter is announced with `aria-live="polite"`, touch targets
are at least 44px, text contrast is at least 4.5:1.

## Code structure

```
studio/
  scripts/export-photos.ts       content pipeline (above)
  src/
    config.ts                    contact email, Instagram, print sizes
    data/collections.json        generated, committed
    route.ts                     parse/format #/slug/n, pure functions
    useGallery.ts                state: collection, index, grid open; next/prev/wrap; syncs route
    components/
      Sidebar.tsx                name, collection list, links
      Viewer.tsx                 the photo (click to advance) or the thumbnail grid
      Controls.tsx               caption, prev/next, counter, thumbnails toggle
      PrintRequest.tsx           size buttons and mailto link
    App.tsx, main.tsx, styles.css
  public/CNAME                   studio.zhoucai.me
  .github/workflows/deploy.yml   same as radio's
```

## Testing

Vitest + Testing Library, like radio.

- `route.ts`: parse and format, unknown slug, out-of-range number, zero and negative numbers.
- `useGallery`: next/prev wrap at both ends, switching collection resets to photo 1,
  grid open/close, route stays in sync.
- Components: clicking the photo advances; arrow keys work; thumbnails open the right photo;
  the mailto link contains the collection, number and selected size.
- `export-photos`: run against a temp folder with two small fixture images (one with an EXIF
  rotation and a GPS tag): output has the right sizes and orientation, no EXIF/GPS remains,
  ordering follows prefixes, `info.json` is applied, and a path containing `Helen Edits` throws.
- Before calling it done: `npm run lint`, `npm test`, `npm run build`, then check the built
  site in a browser at 1440px and 375px.

## Deploy

1. Create the GitHub repo `zhoucaiNi/studio` (public, needed for free Pages) and push `main`.
2. Enable Pages with GitHub Actions as the source.
3. The user adds a Namecheap DNS record: CNAME `studio` → `zhoucaini.github.io.`
4. Once DNS resolves, turn on "Enforce HTTPS".

Steps 1, 2 and 4 are outward-facing, so each is confirmed with the user before running.

# studio.zhoucai.me Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static photography portfolio at studio.zhoucai.me: collections in a side list, click the photo to advance, a thumbnail grid, and a mailto print request.

**Architecture:** A Node script turns `/Volumes/T7/2-Selects/Portfolio/<NN-Name>/` into resized, metadata-free JPEGs in `public/photos/` plus `src/data/collections.json`. A Vite + React app reads that JSON; one hook (`useGallery`) owns which collection and photo are showing and keeps the URL hash in sync. GitHub Actions builds `main` and deploys to Pages.

**Tech Stack:** Vite 8, React 19, TypeScript 6, Vitest 5 + Testing Library + jsdom, oxlint, sharp 0.35 (export script only), Node 23 locally / 22 in CI.

**Spec:** `docs/superpowers/specs/2026-11-11-studio-site-design.md`

## Global Constraints

- Repo: `~/Vault/3-Projects/Web/studio`, branch `main`, remote `zhoucaiNi/studio` (created in Task 7 only).
- Mirror `~/Vault/3-Projects/Web/radio` for config: same `package.json` scripts (`dev`, `build: tsc -b && vite build`, `lint: oxlint`, `preview`, `test: vitest run`), same dev-dependency versions, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `src/test-setup.ts`, `.github/workflows/deploy.yml`.
- Never read from or copy anything in a path containing `Helen Edits`.
- Photos: full = long edge 2000px, JPEG quality 82; thumb = long edge 600px, quality 75; all metadata stripped, EXIF rotation applied.
- Colors: background `#f4f2ee`, text `#1a1a1a`, muted `#5f5b55`, thumbnail cell `#ebe8e2`, rule `#d9d5ce`. Fonts: IBM Plex Sans 400/500, IBM Plex Mono 400/500 from Google Fonts.
- Contact: `nizhoucai@gmail.com`; Instagram `@zhouca2` → `https://instagram.com/zhouca2`; zhoucai.me link `https://zhoucai.me`.
- Print sizes in order: `8×10 in`, `11×14 in`, `16×20 in`, `24×30 in`; default `11×14 in`.
- Print copy, exact: "Archival pigment prints, made to order. Pick a size and send a request; I'll reply with a price and timing."
- URL hash format `#/<slug>/<n>`, n 1-based.
- Commits: Conventional Commits, no Claude attribution lines.
- Touch targets ≥44px; text contrast ≥4.5:1; every `<img>` has alt text.

## Review Focus

- A collection with one photo: next/prev stay on it and the counter reads `01 / 01` (test in Task 4).
- Collection names with `&` or other URL-special characters (e.g. "Dusk & Water"): the mailto subject and body stay intact (test in Task 5).
- Hand-edited hashes: `#/Open-Country/3`, `#/open-country/3/`, `#/open-country/abc`, `#/open-country/99`, empty hash: all land somewhere sensible, never a crash (tests in Task 2).
- An empty collection folder or two folders that make the same slug (`01-Dusk`, `03-dusk`): the empty one is skipped, duplicates throw with both folder names (tests in Task 3).
- Arrow keys while the thumbnail grid is open: they move the photo and close the grid, like the mockup's next button (test in Task 4).

---

### Task 1: Scaffold the app, mirrored from radio

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.oxlintrc.json`, `.gitignore`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test-setup.ts`, `public/CNAME`, `.github/workflows/deploy.yml`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: a building, testing, linting app shell. `index.html` loads the two Plex fonts and has `<title>Zhoucai Ni · Studio</title>` and `<meta name="description" content="Photographs by Zhoucai Ni, San Francisco.">`.

- [ ] **Step 1:** Copy radio's config files listed above (not its `src/` code), set `"name": "studio"`, add `sharp@^0.35.5` to devDependencies, add script `"photos": "node scripts/export-photos.ts"`. Ensure `tsconfig.node.json` includes `scripts/**/*.ts` and has `allowImportingTsExtensions: true`. `public/CNAME` contains exactly `studio.zhoucai.me`. `deploy.yml` is radio's file unchanged.
- [ ] **Step 2:** Write `src/App.test.tsx`: `renders the name` — render `<App />`, expect `screen.getByRole('link', { name: 'Zhoucai Ni' })` to exist.
- [ ] **Step 3:** Run `npm install && npm test`. Expected: FAIL (App does not render the link).
- [ ] **Step 4:** Make `App` render `<a href="https://zhoucai.me">Zhoucai Ni</a>` (placeholder; Task 5 replaces it).
- [ ] **Step 5:** Run `npm test && npm run lint && npm run build`. Expected: all pass, `dist/CNAME` exists.
- [ ] **Step 6:** Commit: `chore: scaffold Vite React app mirrored from radio`.

### Task 2: Types and routing

**Files:**
- Create: `src/types.ts`, `src/route.ts`
- Test: `src/route.test.ts`

**Interfaces:**
- Produces:
  - `src/types.ts`: `export type Photo = { full: string; thumb: string; width: number; height: number; alt: string; caption: string }` and `export type Collection = { slug: string; name: string; photos: Photo[] }`.
  - `src/route.ts`: `parseHash(hash: string, collections: Collection[]): { c: number; i: number }` (0-based indexes) and `formatHash(collections: Collection[], c: number, i: number): string` returning `#/<slug>/<i+1>`.

- [ ] **Step 1:** Write tests in `src/route.test.ts` against a two-collection fixture (`a` with 3 photos, `b` with 1):
  - `parseHash('#/a/2')` → `{ c: 0, i: 1 }`; `parseHash('#/b/1')` → `{ c: 1, i: 0 }`
  - case and trailing slash tolerated: `'#/A/2'` and `'#/a/2/'` → `{ c: 0, i: 1 }`
  - missing number `'#/b'` → `{ c: 1, i: 0 }`
  - bad number `'#/a/abc'`, `'#/a/0'`, `'#/a/-1'` → `{ c: 0, i: 0 }`; out of range `'#/a/99'` → `{ c: 0, i: 2 }` (clamps to last)
  - unknown slug `'#/zzz/2'`, empty `''`, `'#'`, `'#/'` → `{ c: 0, i: 0 }`
  - `formatHash(fixture, 1, 0)` → `'#/b/1'`
- [ ] **Step 2:** Run `npx vitest run src/route.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `parseHash` and `formatHash` in `src/route.ts`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(route): parse and format collection hashes`.

### Task 3: Photo export script

**Files:**
- Create: `scripts/export-photos.ts`
- Test: `scripts/export-photos.test.ts` (first line `// @vitest-environment node`)

**Interfaces:**
- Consumes: `Collection`, `Photo` from `src/types.ts` (`import type`).
- Produces: `export async function exportPhotos(opts: { sourceDir: string; publicDir: string; dataFile: string }): Promise<Collection[]>`. Writes `<publicDir>/photos/<slug>/<NN>-full.jpg` and `-thumb.jpg` (NN = 2-digit 1-based position), writes `dataFile` as pretty JSON (2-space indent, trailing newline), returns the collections. Photo URLs are `/photos/<slug>/<NN>-full.jpg`. When run directly, uses `sourceDir = process.env.PORTFOLIO_DIR ?? '/Volumes/T7/2-Selects/Portfolio'`, `publicDir = 'public'`, `dataFile = 'src/data/collections.json'`, and prints one line per collection (`Open Country: 7 photos`).

- [ ] **Step 1:** Write tests. Each builds a temp source folder with sharp-generated JPEGs (solid color, e.g. 3000×2000) and runs `exportPhotos` into a temp public dir:
  - `orders and names collections`: folders `02-Dusk`, `01-Open-Country` → result names `['Open Country', 'Dusk']`, slugs `['open-country', 'dusk']`.
  - `orders photos by file name`: `b.jpg`, `a.jpg` → `a` becomes `01`.
  - `resizes`: a 3000×2000 source → full is 2000×1333 (or 1334; assert long edge 2000 and `width/height` in JSON match the file), thumb long edge 600.
  - `applies rotation and strips metadata`: a 300×200 source written with `withMetadata({ orientation: 6 })` and a GPS tag via `withExifMerge({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '37/1 46/1 0/1' } })` → output is 200×300 and `(await sharp(out).metadata()).exif` is undefined.
  - `uses info.json`: `{ "a.jpg": { "alt": "Bison", "caption": "2024" } }` → that photo's alt/caption match; a photo not listed gets alt `"Open Country, photo 2"` and caption `""`.
  - `skips unsupported files`: a `.heic` and a `.txt` in the folder are not in the output and are named in a `console.warn` call.
  - `skips empty collections`: an empty `03-Fall` folder produces no collection.
  - `rejects duplicate slugs`: `01-Dusk` and `03-dusk` → rejects with a message containing both folder names.
  - `refuses Helen Edits`: `sourceDir` inside a folder named `Helen Edits (Berlin, Cali)` rejects; a collection folder containing a file whose path includes `Helen Edits` (symlink is fine) rejects.
  - `clears old output`: a stale `public/photos/old/01-full.jpg` is gone after a run.
- [ ] **Step 2:** Run `npx vitest run scripts/export-photos.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `exportPhotos` with sharp: `.rotate()` then `.resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true })` (sharp drops metadata unless asked to keep it); same for thumbs at 600/75. Folder names must match `/^\d+-(.+)$/`; others are skipped with a warning. Add the CLI entry guarded by `import.meta.url === pathToFileURL(process.argv[1]).href`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(photos): export portfolio folders to web images and collections.json`.

### Task 4: Gallery state hook

**Files:**
- Create: `src/useGallery.ts`
- Test: `src/useGallery.test.ts`

**Interfaces:**
- Consumes: `Collection` from `src/types.ts`; `parseHash`, `formatHash` from `src/route.ts`.
- Produces: `useGallery(collections: Collection[]): { c: number; i: number; gridOpen: boolean; collection: Collection; photo: Photo; next(): void; prev(): void; goTo(i: number): void; pickCollection(c: number): void; toggleGrid(): void; closeGrid(): void }`. Initial state comes from `parseHash(location.hash)`. Every change calls `history.replaceState` for photo moves within a collection and `history.pushState` for collection changes, with `formatHash`. Listens to `hashchange` and `popstate` and re-reads the hash. Adds a `keydown` listener on `window`: ArrowRight → `next`, ArrowLeft → `prev`, Escape → `closeGrid`; ignores events whose target is an `input`, `textarea`, `select` or `[contenteditable]`. Preloads `collection.photos[(i + 1) % n].full` with `new Image()`.

- [ ] **Step 1:** Write tests with `renderHook` and the Task 2 fixture:
  - `starts from the hash`: `location.hash = '#/a/2'` before render → `c 0, i 1`.
  - `next and prev wrap`: from `a/3`, `next()` → `i 0`; `prev()` → `i 2`.
  - `single-photo collection`: in `b`, `next()` and `prev()` keep `i 0`.
  - `pickCollection resets to first photo and closes grid`.
  - `goTo opens a photo and closes the grid`.
  - `updates the hash`: after `next()` from `a/1`, `location.hash === '#/a/2'`.
  - `follows hashchange`: set `location.hash = '#/b/1'` and dispatch `hashchange` → `c 1`.
  - `arrow keys move; Escape closes grid; arrows close grid too`.
  - `ignores keys typed in an input`.
- [ ] **Step 2:** Run `npx vitest run src/useGallery.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `useGallery`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(gallery): collection and photo state synced to the URL`.

### Task 5: Components, layout and styles

**Files:**
- Create: `src/config.ts`, `src/components/Sidebar.tsx`, `src/components/Viewer.tsx`, `src/components/Controls.tsx`, `src/components/PrintRequest.tsx`, `src/styles.css`, `src/data/collections.json` (temporary 2-collection fixture using `/photos/fixture/*.jpg` paths; Task 6 overwrites it)
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/App.test.tsx`, `src/components/PrintRequest.test.tsx`

**Interfaces:**
- Consumes: `useGallery` (Task 4), `formatHash` (Task 2), types (Task 2).
- Produces:
  - `src/config.ts`: `export const CONTACT_EMAIL = 'nizhoucai@gmail.com'`, `INSTAGRAM_URL = 'https://instagram.com/zhouca2'`, `INSTAGRAM_HANDLE = '@zhouca2'`, `SITE_URL = 'https://studio.zhoucai.me'`, `PRINT_SIZES = ['8×10 in', '11×14 in', '16×20 in', '24×30 in'] as const`, `DEFAULT_SIZE = '11×14 in'`.
  - `buildPrintMailto(collectionName: string, photoNumber: number, size: string, photoUrl: string): string` exported from `PrintRequest.tsx`, using `encodeURIComponent` for subject and body. Subject: `Print request: <Collection> <NN>`. Body lines: `Collection: …`, `Photo: NN`, `Size: …`, `Link: …`.
  - Layout per spec "Layout": `Sidebar` (name link, collection buttons with 2-digit counts and `aria-current="true"` on the active one, then Prints `#prints`, Info `#info`, Instagram), `Viewer` (photo as a `<button aria-label="Next photo">` wrapping the `<img>`, or the thumbnail grid of `<button aria-label="Open photo NN">`), `Controls` (`<Collection> · <caption>`, prev, counter `NN / NN` in an `aria-live="polite"` element, next, `show thumbnails`/`hide thumbnails`), `PrintRequest` (section `id="prints"`, heading "Prints", the exact print copy, size buttons with `aria-pressed`, link "Request this print"), footer `id="info"` with "San Francisco", the email and zhoucai.me.
  - CSS: desktop grid of a 240px sidebar and the main column; photo box `height: 78vh; min-height: 420px; max-height: 960px` with `object-fit: contain`; at `max-width: 760px` the sidebar stacks on top and the collection list becomes a wrapping row; 150ms opacity fade on photo change, removed under `prefers-reduced-motion: reduce`; 3px focus ring `#1a1a1a` with 2px offset.

- [ ] **Step 1:** Write tests:
  - `App.test.tsx` `clicking the photo advances`: counter goes `01 / 0N` → `02 / 0N`.
  - `choosing a collection shows its first photo` and marks it `aria-current`.
  - `thumbnails open the chosen photo`: toggle grid, click `Open photo 02`, counter reads `02 / …` and the grid is gone.
  - `PrintRequest.test.tsx` `builds the mailto`: `buildPrintMailto('Dusk & Water', 3, '16×20 in', 'https://studio.zhoucai.me/#/dusk-water/3')` decodes (via `new URL` + `decodeURIComponent`) to subject `Print request: Dusk & Water 03` and a body containing `Size: 16×20 in` and the link; address is `nizhoucai@gmail.com`.
  - `size buttons`: default `11×14 in` has `aria-pressed="true"`; clicking `24×30 in` moves it, and the link's href contains `24%C3%9730`.
- [ ] **Step 2:** Run `npm test`. Expected: the new tests FAIL.
- [ ] **Step 3:** Implement config, components, `App` (imports `collections.json`, calls `useGallery`, renders the four parts and footer) and `styles.css`.
- [ ] **Step 4:** Run `npm test && npm run lint && npm run build`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat(site): collections sidebar, click-through viewer and print requests`.

### Task 6: Fill the Portfolio folder and export real photos

**Files:**
- Create on T7: `/Volumes/T7/2-Selects/Portfolio/01-Open-Country/`, `02-Dusk/`, `03-San-Francisco/`, `04-Shoe-Rotations/`, `05-Fall/`, each with an `info.json`
- Generate: `public/photos/**`, `src/data/collections.json`

The 27 sources (copies only, all under `/Volumes/T7/2-Selects/`):

| Collection | Source files |
|---|---|
| Open Country | `2024 Best Photos/edited/2024bests-25.jpg`, `-27.jpg`, `-31.jpg`, `-26.jpg`, `-29.jpg`, `-34.jpg`, `-53.jpg` |
| Dusk | `2024 Best Photos/edited/2024bests-30.jpg`, `-1.jpg`; `2024 Best Photos/DSC08523.JPG`, `DSC09893.JPG` |
| San Francisco | `IG Worthy/DSCF2125.JPG`, `DSCF3517.JPG`, `DSCF3716.JPG`; `2024 Best Photos/DSC08566.JPG`; `IG Worthy/salesforce/DSCF5721.JPG` |
| Shoe Rotations | `IG Worthy/shoe rotations lately/DSCF3381.JPG`, `DSCF2964.JPG`, `DSCF2988.JPG`, `DSCF3149.JPG`, `DSCF6059.JPG`, `DSCF1998.JPG` |
| Fall | `IG Worthy/fall vibes?/DSCF6093.JPG`, `DSCF6101.JPG`, `DSCF6134.JPG`; `IG Worthy/Porch pumpkins of Boston/DSCF6190.JPG`, `DSCF6202.JPG` |

- [ ] **Step 1:** Check every source path exists and is a regular file (not a symlink) outside `Helen Edits`: `test -f "$p" && ! test -L "$p"` for each. Expected: all 27 pass.
- [ ] **Step 2:** Show the user the dry-run copy plan (source → `Portfolio/<collection>/<NN>-<original name>`). Wait for approval.
- [ ] **Step 3:** Copy with `cp -n` (never overwrite), then write each folder's `info.json` with the alt text and captions from the mockup (canvas file `Contact.dc.html`, `data()`), e.g. `"Open Country"` captions `2024`, San Francisco captions `San Francisco`, Shoe Rotations `Ongoing`, Fall `Fall` / `Boston`.
- [ ] **Step 4:** Run `npm run photos`. Expected output: `Open Country: 7 photos`, `Dusk: 4 photos`, `San Francisco: 5 photos`, `Shoe Rotations: 6 photos`, `Fall: 5 photos`.
- [ ] **Step 5:** Verify no metadata survived: `for f in public/photos/*/*.jpg; do mdls -name kMDItemLatitude "$f"; done` prints only `(null)`. Run `npm test && npm run build`.
- [ ] **Step 6:** Commit: `feat(content): add the first five collections`.

### Task 7: Check in a browser, then deploy

- [ ] **Step 1:** `npm run build && npm run preview`. In a browser at 1440px and 375px wide: click through every collection, use arrow keys, open and close thumbnails, try a size and click "Request this print" (mail app opens with the right subject), reload on `#/fall/3`, use Back. No horizontal scroll at 375px. Show the user and fix anything they flag.
- [ ] **Step 2:** Ask the user before each: `gh repo create zhoucaiNi/studio --public --source . --push`; then enable Pages with GitHub Actions as the source (`gh api -X POST repos/zhoucaiNi/studio/pages -f build_type=workflow`).
- [ ] **Step 3:** Watch the Actions run until the deploy job succeeds (`gh run watch`).
- [ ] **Step 4:** Tell the user to add the Namecheap record: CNAME, host `studio`, value `zhoucaini.github.io.`. Once `dig +short studio.zhoucai.me` shows GitHub's hosts, ask before enabling HTTPS (`gh api -X PUT repos/zhoucaiNi/studio/pages -F https_enforced=true`).
- [ ] **Step 5:** Load `https://studio.zhoucai.me` and repeat the Step 1 checks on the live site.
- [ ] **Step 6:** On the zhoucai.me repo, branch `feat/studio-sidebar-link` from `origin/landing` (after PR #16 merges, so it builds on the Radio item). Add a "Studio" item below Radio in `photo.html`'s Library sidebar, same markup as Radio, with a camera-aperture stroke icon, `href="https://studio.zhoucai.me"` and sr-only text " (studio.zhoucai.me)". Check it locally, then ask the user before pushing and opening the PR against `landing`.

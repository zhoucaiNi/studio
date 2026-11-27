// The colour a photo "is", for the Colour page. Shrinks the image and groups its pixels by hue (12 slices around the
// colour wheel). Each pixel counts by how colourful it is, and near-black pixels count for nothing, so a big dark patch
// can't beat a sky made of many different purples. The photo's colour is the average of the heaviest hue slice.
// A photo with almost no colour (black and white) comes back as its plain average, a neutral grey.
// Usage: node scripts/dominant-colour.ts   (adds "color" to every photo in src/data/collections.json from its thumbnail)
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { labFromRgb } from '../src/colour.ts'
import type { Collection } from '../src/types.ts'

const HUES = 12
const DARK = 8 // lightness below this is ignored: a tint on near-black is not a colour
const BRIGHT = 25 // lightness from here on counts in full
const NEUTRAL = 3 // average colourfulness per pixel below this means "no real colour"

const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

export async function dominantHex(path: string): Promise<string> {
  const { data } = await sharp(path).rotate().resize(40, 40, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const slices = Array.from({ length: HUES }, () => ({ w: 0, r: 0, g: 0, b: 0 }))
  const all = { n: 0, r: 0, g: 0, b: 0 }
  let colourful = 0
  for (let k = 0; k < data.length; k += 3) {
    const [r, g, b] = [data[k], data[k + 1], data[k + 2]]
    const { l, a, b: lb } = labFromRgb(r, g, b)
    const w = Math.hypot(a, lb) * Math.min(1, Math.max(0, (l - DARK) / (BRIGHT - DARK)))
    const slice = slices[Math.round((Math.atan2(lb, a) + Math.PI) / ((2 * Math.PI) / HUES)) % HUES]
    slice.w += w
    slice.r += r * w
    slice.g += g * w
    slice.b += b * w
    colourful += w
    all.n++
    all.r += r
    all.g += g
    all.b += b
  }
  if (colourful / all.n < NEUTRAL) return toHex(all.r / all.n, all.g / all.n, all.b / all.n)
  const best = slices.reduce((x, y) => (y.w > x.w ? y : x))
  return toHex(best.r / best.w, best.g / best.w, best.b / best.w)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataFile = 'src/data/collections.json'
  const collections: Collection[] = JSON.parse(await readFile(dataFile, 'utf8'))
  for (const c of collections) for (const p of c.photos) p.color = await dominantHex('public' + p.thumb)
  await writeFile(dataFile, JSON.stringify(collections, null, 2) + '\n')
  console.log(`${collections.reduce((n, c) => n + c.photos.length, 0)} photos coloured`)
}

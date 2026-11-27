// The colour a photo "is", for the Colour page. Shrinks the image, buckets pixels by 3 bits per channel,
// weights each pixel by saturation (so black and white borders count for little), and averages the heaviest bucket.
// Usage: node scripts/dominant-colour.ts   (adds "color" to every photo in src/data/collections.json from its thumbnail)
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import type { Collection } from '../src/types.ts'

export async function dominantHex(path: string): Promise<string> {
  const { data } = await sharp(path).rotate().resize(40, 40, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const buckets = new Map<number, { w: number; r: number; g: number; b: number }>()
  for (let k = 0; k < data.length; k += 3) {
    const [r, g, b] = [data[k], data[k + 1], data[k + 2]]
    const max = Math.max(r, g, b)
    const saturation = max ? (max - Math.min(r, g, b)) / max : 0
    const w = 0.15 + saturation
    const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5)
    const e = buckets.get(key) ?? { w: 0, r: 0, g: 0, b: 0 }
    e.w += w
    e.r += r * w
    e.g += g * w
    e.b += b * w
    buckets.set(key, e)
  }
  const best = [...buckets.values()].sort((x, y) => y.w - x.w)[0]
  return '#' + [best.r, best.g, best.b].map((v) => Math.round(v / best.w).toString(16).padStart(2, '0')).join('')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataFile = 'src/data/collections.json'
  const collections: Collection[] = JSON.parse(await readFile(dataFile, 'utf8'))
  for (const c of collections) for (const p of c.photos) p.color = await dominantHex('public' + p.thumb)
  await writeFile(dataFile, JSON.stringify(collections, null, 2) + '\n')
  console.log(`${collections.reduce((n, c) => n + c.photos.length, 0)} photos coloured`)
}

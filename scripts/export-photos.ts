// Turns the Portfolio folder on the T7 into web-sized photos and collections.json.
// Usage: npm run photos   (PORTFOLIO_DIR overrides the source folder)
import { mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import type { Collection, Photo } from '../src/types.ts'

const FORBIDDEN = 'Helen Edits'
const PHOTO_TYPES = new Set(['.jpg', '.jpeg', '.png'])
const FULL = { size: 2000, quality: 82 }
const THUMB = { size: 600, quality: 75 }

type Info = Record<string, { alt?: string; caption?: string }>
type Plan = { slug: string; name: string; dir: string; files: string[]; info: Info }

function refuseForbidden(path: string) {
  if (path.includes(FORBIDDEN)) throw new Error(`Refusing to read from "${FORBIDDEN}": ${path}`)
}

async function plan(sourceDir: string): Promise<Plan[]> {
  refuseForbidden(await realpath(sourceDir))
  const folders = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))

  const plans: Plan[] = []
  const seen = new Map<string, string>()
  for (const folder of folders) {
    const match = /^\d+-(.+)$/.exec(folder)
    if (!match) {
      console.warn(`Skipping folder without a number prefix: ${folder}`)
      continue
    }
    const name = match[1].replace(/-/g, ' ')
    const slug = match[1].toLowerCase()
    const other = seen.get(slug)
    if (other) throw new Error(`Folders "${other}" and "${folder}" both make the slug "${slug}"`)
    seen.set(slug, folder)

    const dir = join(sourceDir, folder)
    const files: string[] = []
    for (const file of (await readdir(dir)).sort()) {
      if (file === 'info.json' || file.startsWith('.')) continue
      if (!PHOTO_TYPES.has(extname(file).toLowerCase())) {
        console.warn(`Skipping unsupported file: ${join(folder, file)}`)
        continue
      }
      refuseForbidden(await realpath(join(dir, file)))
      files.push(file)
    }
    if (files.length === 0) continue
    const infoPath = join(dir, 'info.json')
    const info: Info = existsSync(infoPath) ? JSON.parse(await readFile(infoPath, 'utf8')) : {}
    plans.push({ slug, name, dir, files, info })
  }
  return plans
}

// EXIF rotation applied; sharp writes no metadata unless asked, so GPS and the rest are dropped
function resized(path: string, { size, quality }: { size: number; quality: number }) {
  return sharp(path)
    .rotate()
    .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
}

export async function exportPhotos(opts: { sourceDir: string; publicDir: string; dataFile: string }): Promise<Collection[]> {
  const plans = await plan(opts.sourceDir)
  const photosDir = join(opts.publicDir, 'photos')
  await rm(photosDir, { recursive: true, force: true })

  const collections: Collection[] = []
  for (const p of plans) {
    await mkdir(join(photosDir, p.slug), { recursive: true })
    const photos: Photo[] = []
    for (const [k, file] of p.files.entries()) {
      const nn = String(k + 1).padStart(2, '0')
      const src = join(p.dir, file)
      const full = await resized(src, FULL).toFile(join(photosDir, p.slug, `${nn}-full.jpg`))
      await resized(src, THUMB).toFile(join(photosDir, p.slug, `${nn}-thumb.jpg`))
      photos.push({
        full: `/photos/${p.slug}/${nn}-full.jpg`,
        thumb: `/photos/${p.slug}/${nn}-thumb.jpg`,
        width: full.width,
        height: full.height,
        alt: p.info[file]?.alt ?? `${p.name}, photo ${k + 1}`,
        caption: p.info[file]?.caption ?? '',
      })
    }
    collections.push({ slug: p.slug, name: p.name, photos })
  }

  await mkdir(resolve(opts.dataFile, '..'), { recursive: true })
  await writeFile(opts.dataFile, JSON.stringify(collections, null, 2) + '\n')
  return collections
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const collections = await exportPhotos({
    sourceDir: process.env.PORTFOLIO_DIR ?? '/Volumes/T7/2-Selects/Portfolio',
    publicDir: 'public',
    dataFile: 'src/data/collections.json',
  })
  for (const c of collections) console.log(`${c.name}: ${c.photos.length} photos`)
}

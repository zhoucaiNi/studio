// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { exportPhotos } from './export-photos.ts'

let root: string
let src: string
let pub: string
let dataFile: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'studio-export-'))
  src = join(root, 'Portfolio')
  pub = join(root, 'public')
  dataFile = join(root, 'collections.json')
  await mkdir(src)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rm(root, { recursive: true, force: true })
})

async function jpeg(path: string, width = 300, height = 200) {
  await mkdir(join(path, '..'), { recursive: true })
  await sharp({ create: { width, height, channels: 3, background: '#4a7' } }).jpeg().toFile(path)
}

const run = () => exportPhotos({ sourceDir: src, publicDir: pub, dataFile })

test('orders and names collections by folder prefix', async () => {
  await jpeg(join(src, '02-Dusk', 'a.jpg'))
  await jpeg(join(src, '01-Open-Country', 'a.jpg'))
  const result = await run()
  expect(result.map((c) => c.name)).toEqual(['Open Country', 'Dusk'])
  expect(result.map((c) => c.slug)).toEqual(['open-country', 'dusk'])
  const written = JSON.parse(await readFile(dataFile, 'utf8'))
  expect(written).toEqual(result)
})

test('orders photos by file name', async () => {
  await jpeg(join(src, '01-Dusk', 'b.jpg'), 300, 200)
  await jpeg(join(src, '01-Dusk', 'a.jpg'), 200, 300)
  const [dusk] = await run()
  expect(dusk.photos[0].full).toBe('/photos/dusk/01-full.jpg')
  expect(dusk.photos[0].height).toBeGreaterThan(dusk.photos[0].width) // a.jpg is the tall one
  expect(dusk.photos[1].thumb).toBe('/photos/dusk/02-thumb.jpg')
})

test('resizes full images to a 2000px long edge and thumbs to 600px', async () => {
  await jpeg(join(src, '01-Dusk', 'big.jpg'), 3000, 2000)
  const [dusk] = await run()
  const full = await sharp(join(pub, 'photos/dusk/01-full.jpg')).metadata()
  const thumb = await sharp(join(pub, 'photos/dusk/01-thumb.jpg')).metadata()
  expect(full.width).toBe(2000)
  expect(thumb.width).toBe(600)
  expect(dusk.photos[0]).toMatchObject({ width: full.width, height: full.height })
})

test('applies EXIF rotation and strips all metadata', async () => {
  const path = join(src, '01-Dusk', 'rotated.jpg')
  await mkdir(join(src, '01-Dusk'))
  await sharp({ create: { width: 300, height: 200, channels: 3, background: '#a47' } })
    .withMetadata({ orientation: 6 })
    .withExifMerge({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '37/1 46/1 0/1' } })
    .jpeg()
    .toFile(path)
  expect((await sharp(path).metadata()).exif).toBeDefined()
  await run()
  for (const kind of ['full', 'thumb']) {
    const meta = await sharp(join(pub, `photos/dusk/01-${kind}.jpg`)).metadata()
    expect(meta.height).toBeGreaterThan(meta.width!)
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation).toBeUndefined()
  }
})

test('uses info.json for alt text and captions, with fallbacks', async () => {
  await jpeg(join(src, '01-Open-Country', 'a.jpg'))
  await jpeg(join(src, '01-Open-Country', 'b.jpg'))
  await writeFile(join(src, '01-Open-Country', 'info.json'), JSON.stringify({ 'a.jpg': { alt: 'Bison', caption: '2024' } }))
  const [country] = await run()
  expect(country.photos[0]).toMatchObject({ alt: 'Bison', caption: '2024' })
  expect(country.photos[1]).toMatchObject({ alt: 'Open Country, photo 2', caption: '' })
})

test('skips unsupported files and names them in a warning', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  await jpeg(join(src, '01-Dusk', 'a.jpg'))
  await writeFile(join(src, '01-Dusk', 'phone.heic'), 'x')
  await writeFile(join(src, '01-Dusk', 'notes.txt'), 'x')
  const [dusk] = await run()
  expect(dusk.photos).toHaveLength(1)
  const warned = warn.mock.calls.flat().join(' ')
  expect(warned).toContain('phone.heic')
  expect(warned).toContain('notes.txt')
})

test('skips empty collections', async () => {
  await jpeg(join(src, '01-Dusk', 'a.jpg'))
  await mkdir(join(src, '03-Fall'))
  const result = await run()
  expect(result.map((c) => c.slug)).toEqual(['dusk'])
})

test('rejects two folders that make the same slug', async () => {
  await jpeg(join(src, '01-Dusk', 'a.jpg'))
  await jpeg(join(src, '03-dusk', 'a.jpg'))
  await expect(run()).rejects.toThrow(/01-Dusk.*03-dusk|03-dusk.*01-Dusk/)
})

test('refuses a source folder inside Helen Edits', async () => {
  const helen = join(root, 'Helen Edits (Berlin, Cali)', 'Portfolio')
  await jpeg(join(helen, '01-Dusk', 'a.jpg'))
  await expect(exportPhotos({ sourceDir: helen, publicDir: pub, dataFile })).rejects.toThrow(/Helen Edits/)
  expect(existsSync(dataFile)).toBe(false)
})

test('refuses a photo that links into Helen Edits', async () => {
  const target = join(root, 'Helen Edits (Berlin, Cali)', 'x.jpg')
  await jpeg(target)
  await mkdir(join(src, '01-Dusk'))
  await symlink(target, join(src, '01-Dusk', 'link.jpg'))
  await expect(run()).rejects.toThrow(/Helen Edits/)
  expect(existsSync(dataFile)).toBe(false)
})

test('clears photos from earlier runs', async () => {
  await jpeg(join(pub, 'photos', 'old', '01-full.jpg'))
  await jpeg(join(src, '01-Dusk', 'a.jpg'))
  await run()
  expect(existsSync(join(pub, 'photos', 'old'))).toBe(false)
})

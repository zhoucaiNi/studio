// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { dominantHex } from './dominant-colour.ts'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'studio-colour-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

// stripes of flat colour, top to bottom, each `share` of the height
async function stripes(parts: [string, number][]) {
  const height = 100
  const path = join(dir, 'p.png')
  let top = 0
  const layers = parts.map(([colour, share]) => {
    const h = Math.round(height * share)
    const layer = { input: { create: { width: 100, height: h, channels: 3 as const, background: colour } }, top, left: 0 }
    top += h
    return layer
  })
  await sharp({ create: { width: 100, height, channels: 3, background: '#000' } }).composite(layers).png().toFile(path)
  return path
}

const rgb = (hex: string) => [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16))

test('a purple sky over dark hills is purple, not the hills’ near-black', async () => {
  // a real sky is a gradient: many different purples and pinks, none of them big; the hills are one flat patch
  const sky = ['#9391cd', '#ae6893', '#9072ad', '#7669ae', '#c27ab0', '#a88bd0', '#8f6bb5', '#b86fa3', '#6f5fa8', '#d08cb8', '#8a7bc8', '#a05f9a']
  const path = await stripes([...sky.map((c): [string, number] => [c, 0.05]), ['#101013', 0.4]])
  const [r, g, b] = rgb(await dominantHex(path))
  expect(b).toBeGreaterThan(g)
  expect(r).toBeGreaterThan(g)
  expect(Math.max(r, g, b)).toBeGreaterThan(100)
})

test('a small patch of real colour beats a large patch of tinted black', async () => {
  const [r, g, b] = rgb(await dominantHex(await stripes([['#101013', 0.85], ['#c4452f', 0.15]])))
  expect(r).toBeGreaterThan(g)
  expect(r).toBeGreaterThan(b)
  expect(r).toBeGreaterThan(120)
})

test('a photo with no real colour comes back as a neutral grey', async () => {
  const [r, g, b] = rgb(await dominantHex(await stripes([['#202020', 0.5], ['#d0d0d0', 0.5]])))
  expect(Math.abs(r - g)).toBeLessThan(6)
  expect(Math.abs(g - b)).toBeLessThan(6)
})

test('a plain black photo stays black', async () => {
  const [r, g, b] = rgb(await dominantHex(await stripes([['#050505', 1]])))
  expect(Math.max(r, g, b)).toBeLessThan(20)
})

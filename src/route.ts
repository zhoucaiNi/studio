import type { Collection } from './types.ts'

export type Position = { c: number; i: number }

// '#/<slug>/<n>' with n 1-based; anything unreadable falls back to the first photo
export function parseHash(hash: string, collections: Collection[]): Position {
  const [slug = '', num] = hash.replace(/^#\/?/, '').toLowerCase().split('/')
  const c = collections.findIndex((col) => col.slug === slug)
  if (c === -1) return { c: 0, i: 0 }
  const n = Number(num)
  if (!Number.isInteger(n) || n < 1) return { c, i: 0 }
  return { c, i: Math.min(n, collections[c].photos.length) - 1 }
}

export function formatHash(collections: Collection[], c: number, i: number): string {
  return `#/${collections[c].slug}/${i + 1}`
}

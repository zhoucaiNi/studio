import type { Collection, Photo } from '../types.ts'

const photo = (slug: string, n: number, color: string): Photo => ({
  large: `/photos/${slug}/0${n}-large.jpg`,
  largeWidth: 3200,
  full: `/photos/${slug}/0${n}-full.jpg`,
  thumb: `/photos/${slug}/0${n}-thumb.jpg`,
  width: 2000,
  height: 1333,
  alt: `${slug} photo ${n}`,
  caption: `caption ${slug} ${n}`,
  color,
})

// "a" has three photos, "b" has one. a1 and a2 are both near black, so they group; a3 is red, b1 is blue.
export const fixture: Collection[] = [
  { slug: 'a', name: 'Alpha', photos: [photo('a', 1, '#101013'), photo('a', 2, '#0d0e0d'), photo('a', 3, '#c4452f')] },
  { slug: 'b', name: 'Beta & Co', photos: [photo('b', 1, '#2f5fa8')] },
]

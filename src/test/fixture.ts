import type { Collection, Photo } from '../types.ts'

const photo = (slug: string, n: number): Photo => ({
  large: `/photos/${slug}/0${n}-large.jpg`,
  largeWidth: 3200,
  full: `/photos/${slug}/0${n}-full.jpg`,
  thumb: `/photos/${slug}/0${n}-thumb.jpg`,
  width: 2000,
  height: 1333,
  alt: `${slug} photo ${n}`,
  caption: `caption ${slug} ${n}`,
})

// "a" has three photos, "b" has one
export const fixture: Collection[] = [
  { slug: 'a', name: 'Alpha', photos: [photo('a', 1), photo('a', 2), photo('a', 3)] },
  { slug: 'b', name: 'Beta & Co', photos: [photo('b', 1)] },
]

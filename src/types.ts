export type Photo = {
  full: string
  thumb: string
  width: number
  height: number
  alt: string
  caption: string
}

export type Collection = {
  slug: string
  name: string
  photos: Photo[]
}

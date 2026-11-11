export type Photo = {
  large: string // up to 3200px, for high-density screens
  largeWidth: number
  full: string // up to 2000px
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

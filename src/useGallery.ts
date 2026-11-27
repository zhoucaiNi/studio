import { useCallback, useEffect, useRef, useState } from 'react'
import { COLOUR_HASH, formatHash, isColourHash, parseHash } from './route.ts'
import type { Collection } from './types.ts'

type View = { c: number; i: number; gridOpen: boolean; colour: boolean }

const fromHash = (collections: Collection[]): View => ({
  ...parseHash(location.hash, collections),
  gridOpen: false,
  colour: isColourHash(location.hash),
})

// the colour page counts as its own place in history, like a collection does
const placeOf = (v: View) => (v.colour ? -1 : v.c)

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function useGallery(collections: Collection[]) {
  const [view, setView] = useState<View>(() => fromHash(collections))
  const { c, i, gridOpen, colour } = view
  const collection = collections[c]
  const n = collection.photos.length

  const step = useCallback(
    (delta: number) =>
      setView((v) => {
        const len = collections[v.c].photos.length
        return { c: v.c, i: (v.i + delta + len) % len, gridOpen: false, colour: false }
      }),
    [collections],
  )
  const next = useCallback(() => step(1), [step])
  const prev = useCallback(() => step(-1), [step])
  const goTo = useCallback((to: number) => setView((v) => ({ c: v.c, i: to, gridOpen: false, colour: false })), [])
  const pickCollection = useCallback((to: number) => setView({ c: to, i: 0, gridOpen: false, colour: false }), [])
  const openPhoto = useCallback((to: number, photo: number) => setView({ c: to, i: photo, gridOpen: false, colour: false }), [])
  const openColour = useCallback(() => setView((v) => ({ ...v, gridOpen: false, colour: true })), [])
  const toggleGrid = useCallback(() => setView((v) => ({ ...v, gridOpen: !v.gridOpen })), [])
  const closeGrid = useCallback(() => setView((v) => ({ ...v, gridOpen: false })), [])

  // Keep the URL in step: a new collection (or the colour page) is a history entry, moving within one is not
  const place = placeOf(view)
  const lastPlace = useRef(place)
  useEffect(() => {
    const hash = colour ? COLOUR_HASH : formatHash(collections, c, i)
    if (location.hash !== hash) {
      if (lastPlace.current !== place) history.pushState(null, '', hash)
      else history.replaceState(null, '', hash)
    }
    lastPlace.current = place
  }, [collections, c, i, colour, place])

  useEffect(() => {
    const follow = () => {
      // in-page anchors like #prints are not photo links
      if (location.hash && !location.hash.startsWith('#/')) return
      const next = fromHash(collections)
      lastPlace.current = placeOf(next) // fixing up a hand-typed hash replaces it instead of adding history
      setView(next)
    }
    window.addEventListener('hashchange', follow)
    window.addEventListener('popstate', follow)
    return () => {
      window.removeEventListener('hashchange', follow)
      window.removeEventListener('popstate', follow)
    }
  }, [collections])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      if (colour) return // no photo is showing, so there is nothing to step through
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') closeGrid()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, closeGrid, colour])

  // Load the next photo early so a click shows it at once
  const upcoming = collection.photos[(i + 1) % n].full
  useEffect(() => {
    new Image().src = upcoming
  }, [upcoming])

  return {
    c,
    i,
    gridOpen,
    colour,
    collection,
    photo: collection.photos[i],
    next,
    prev,
    goTo,
    pickCollection,
    openPhoto,
    openColour,
    toggleGrid,
    closeGrid,
  }
}

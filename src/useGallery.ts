import { useCallback, useEffect, useRef, useState } from 'react'
import { formatHash, parseHash } from './route.ts'
import type { Collection } from './types.ts'

type View = { c: number; i: number; gridOpen: boolean }

const fromHash = (collections: Collection[]): View => ({ ...parseHash(location.hash, collections), gridOpen: false })

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function useGallery(collections: Collection[]) {
  const [view, setView] = useState<View>(() => fromHash(collections))
  const { c, i, gridOpen } = view
  const collection = collections[c]
  const n = collection.photos.length

  const step = useCallback(
    (delta: number) =>
      setView((v) => {
        const len = collections[v.c].photos.length
        return { c: v.c, i: (v.i + delta + len) % len, gridOpen: false }
      }),
    [collections],
  )
  const next = useCallback(() => step(1), [step])
  const prev = useCallback(() => step(-1), [step])
  const goTo = useCallback((to: number) => setView((v) => ({ c: v.c, i: to, gridOpen: false })), [])
  const pickCollection = useCallback((to: number) => setView({ c: to, i: 0, gridOpen: false }), [])
  const toggleGrid = useCallback(() => setView((v) => ({ ...v, gridOpen: !v.gridOpen })), [])
  const closeGrid = useCallback(() => setView((v) => ({ ...v, gridOpen: false })), [])

  // Keep the URL in step: a new collection is a history entry, moving within one is not
  const lastC = useRef(c)
  useEffect(() => {
    const hash = formatHash(collections, c, i)
    if (location.hash !== hash) {
      if (lastC.current !== c) history.pushState(null, '', hash)
      else history.replaceState(null, '', hash)
    }
    lastC.current = c
  }, [collections, c, i])

  useEffect(() => {
    const follow = () => setView(fromHash(collections))
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
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') closeGrid()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, closeGrid])

  // Load the next photo early so a click shows it at once
  const upcoming = collection.photos[(i + 1) % n].full
  useEffect(() => {
    new Image().src = upcoming
  }, [upcoming])

  return { c, i, gridOpen, collection, photo: collection.photos[i], next, prev, goTo, pickCollection, toggleGrid, closeGrid }
}

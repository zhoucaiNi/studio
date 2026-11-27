import { INSTAGRAM_URL, MAIN_SITE_URL } from '../config.ts'
import { pad } from '../pad.ts'
import type { Collection } from '../types.ts'

type Props = {
  collections: Collection[]
  current: number
  colour: boolean
  onPick: (c: number) => void
  onColour: () => void
}

export function Sidebar({ collections, current, colour, onPick, onColour }: Props) {
  return (
    <aside className="sidebar">
      <a className="name" href={MAIN_SITE_URL}>
        Zhoucai Ni
      </a>
      <nav aria-label="Collections">
        <p className="label">Collections</p>
        <ul className="collections">
          {collections.map((col, k) => (
            <li key={col.slug}>
              <button
                type="button"
                className="collection"
                aria-current={k === current && !colour ? 'true' : undefined}
                onClick={() => onPick(k)}
              >
                <span>{col.name}</span>
                <span className="count">{pad(col.photos.length)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="All photos" className="all-photos">
        <p className="label">All photos</p>
        <button type="button" className="collection" aria-current={colour ? 'true' : undefined} onClick={onColour}>
          <span>Colour</span>
          <span className="count">{pad(collections.reduce((n, col) => n + col.photos.length, 0))}</span>
        </button>
      </nav>
      <nav aria-label="Site" className="site-links">
        <a href={INSTAGRAM_URL}>Instagram</a>
      </nav>
    </aside>
  )
}

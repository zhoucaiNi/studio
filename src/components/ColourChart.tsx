import { useEffect, useMemo, useRef, useState } from 'react'
import { groupByColour, placeGroups } from '../colour.ts'
import { pad } from '../pad.ts'
import type { Collection } from '../types.ts'

type Props = { collections: Collection[]; onOpen: (c: number, i: number) => void }

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function ColourChart({ collections, onOpen }: Props) {
  const entries = useMemo(
    () =>
      collections.flatMap((col, c) =>
        col.photos.map((photo, i) => ({ hex: photo.color, c, i, photo, name: col.name })),
      ),
    [collections],
  )
  const groups = useMemo(() => groupByColour(entries), [entries])

  // the chart's real size decides how far apart the squares go (a phone is much smaller than a desktop)
  const chartRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1000, h: 620 })
  useEffect(() => {
    const el = chartRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const read = () => {
      const r = el.getBoundingClientRect()
      if (r.width && r.height) setSize({ w: r.width, h: r.height })
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const square = size.w < 560 ? 28 : 44
  const spots = useMemo(
    () => placeGroups(groups, { width: size.w, height: size.h, gap: square + 14 }),
    [groups, size, square],
  )

  const [picked, setPicked] = useState(0)
  const [shown, setShown] = useState(0)
  const pick = (k: number) => {
    if (k === picked) return
    setPicked(k)
    setShown(0)
  }

  const group = groups[picked]
  const current = group.items[shown]
  // the card sits in the corner away from the square you picked, so it never covers it
  const side = `${spots[picked].x > size.w / 2 ? 'left' : 'right'} ${spots[picked].y > size.h / 2 ? 'top' : 'bottom'}`

  return (
    <div className="colour">
      <div className="colour-stage">
        <div ref={chartRef} className="colour-chart" style={{ ['--sq' as string]: `${square}px` }}>
          <span className="colour-axis colour-axis-x" aria-hidden="true" />
          <span className="colour-axis colour-axis-y" aria-hidden="true" />
          <span className="label colour-end colour-yellow" aria-hidden="true">yellow</span>
          <span className="label colour-end colour-blue" aria-hidden="true">blue</span>
          <span className="label colour-end colour-green" aria-hidden="true">green</span>
          <span className="label colour-end colour-red" aria-hidden="true">red</span>
          {groups.map((g, k) => (
            <button
              key={g.hex + k}
              type="button"
              className="colour-hit"
              style={{ left: spots[k].x, top: spots[k].y }}
              aria-label={`${plural(g.items.length, 'photo')}, ${g.hex}`}
              aria-current={k === picked ? 'true' : undefined}
              onMouseEnter={() => pick(k)}
              onFocus={() => pick(k)}
              onClick={() => pick(k)}
            >
              {g.items.length > 1 && <span className="colour-sq colour-sq-back" style={{ background: g.hex }} />}
              <span className="colour-sq" style={{ background: g.hex }} />
              {g.items.length > 1 && <span className="colour-count">{g.items.length}</span>}
            </button>
          ))}
        </div>
        <div className={`colour-card ${side}`}>
          <p className="label">
            {plural(group.items.length, 'photo')} · {group.hex}
          </p>
          <button
            type="button"
            className="colour-big"
            aria-label={`Open ${current.photo.alt}`}
            onClick={() => onOpen(current.c, current.i)}
          >
            <img src={current.photo.thumb} alt="" />
          </button>
          <ul className="colour-members">
            {group.items.map((m, k) => (
              <li key={m.photo.thumb}>
                <button
                  type="button"
                  className="colour-member"
                  aria-label={`${m.name} ${pad(m.i + 1)}`}
                  aria-current={k === shown ? 'true' : undefined}
                  onClick={() => setShown(k)}
                >
                  <img src={m.photo.thumb} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="controls">
        <p className="caption">{`Colour · ${plural(entries.length, 'photo')} in ${plural(groups.length, 'group')}`}</p>
        <div className="nav-buttons">
          <span className="muted">
            {current.name} · {pad(current.i + 1)}
          </span>
          <button type="button" className="toggle" onClick={() => onOpen(current.c, current.i)}>
            open photo
          </button>
        </div>
      </div>
    </div>
  )
}

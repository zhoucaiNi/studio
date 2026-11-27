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
  // the wheel is a true circle, so the squares are placed in a centred square; the dotted axes still run the full width
  const side = Math.min(size.w, size.h)
  const spots = useMemo(() => {
    const placed = placeGroups(groups, { width: side, height: side, gap: square + 14 })
    return placed.map((s) => ({ x: s.x + (size.w - side) / 2, y: s.y + (size.h - side) / 2 }))
  }, [groups, side, size, square])
  const cx = size.w / 2
  const cy = size.h / 2
  const half = side / 2 - square * 0.75
  const reach = (side / 2) * 0.92

  const [picked, setPicked] = useState(0)
  const [shown, setShown] = useState(0)
  const pick = (k: number) => {
    if (k === picked) return
    setPicked(k)
    setShown(0)
  }

  const group = groups[picked]
  const current = group.items[shown]

  return (
    <div className="colour">
      <div ref={chartRef} className="colour-chart" style={{ ['--sq' as string]: `${square}px` }}>
        <svg className="colour-backdrop" width={size.w} height={size.h} aria-hidden="true">
          <circle className="colour-ring colour-ring-outer" cx={cx} cy={cy} r={half * 0.78} />
          <circle className="colour-ring colour-ring-inner" cx={cx} cy={cy} r={half * 0.45} />
          <line className="colour-diagonal" x1={cx - reach} y1={cy - reach} x2={cx + reach} y2={cy + reach} />
          <line className="colour-diagonal" x1={cx - reach} y1={cy + reach} x2={cx + reach} y2={cy - reach} />
          <line className="colour-dotted" x1={0} y1={cy} x2={size.w} y2={cy} />
          <line className="colour-dotted" x1={cx} y1={0} x2={cx} y2={size.h} />
          <circle className="colour-centre" cx={cx} cy={cy} r={2.5} />
          <text className="colour-label colour-yellow" x={cx + 8} y={14}>yellow +b*</text>
          <text className="colour-label colour-blue" x={cx + 8} y={size.h - 6}>blue −b*</text>
          <text className="colour-label colour-green" x={0} y={cy - 8}>green −a*</text>
          <text className="colour-label colour-red" x={size.w} y={cy - 8} textAnchor="end">red +a*</text>
        </svg>
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
      {/* the photos always show here, in the same place */}
      <aside className="colour-panel" aria-label="Photos in this colour">
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
        <div className="colour-open">
          <span className="muted">
            {current.name} · {pad(current.i + 1)}
          </span>
          <button type="button" className="toggle" onClick={() => onOpen(current.c, current.i)}>
            open photo
          </button>
        </div>
      </aside>
      <p className="label colour-caption">{`Colour · ${plural(entries.length, 'photo')} in ${plural(groups.length, 'group')}`}</p>
    </div>
  )
}

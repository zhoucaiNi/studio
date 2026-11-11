import { pad } from '../pad.ts'

type Props = {
  collectionName: string
  caption: string
  index: number
  total: number
  gridOpen: boolean
  onPrev: () => void
  onNext: () => void
  onToggleGrid: () => void
}

export function Controls({ collectionName, caption, index, total, gridOpen, onPrev, onNext, onToggleGrid }: Props) {
  return (
    <div className="controls">
      <p className="caption">
        {collectionName}
        {caption && ` · ${caption}`}
      </p>
      <div className="nav-buttons">
        <button type="button" onClick={onPrev}>
          prev
        </button>
        <span className="muted" data-testid="counter" aria-live="polite">
          {pad(index + 1)} / {pad(total)}
        </span>
        <button type="button" onClick={onNext}>
          next
        </button>
        <button type="button" className="toggle" onClick={onToggleGrid}>
          {gridOpen ? 'hide thumbnails' : 'show thumbnails'}
        </button>
      </div>
    </div>
  )
}

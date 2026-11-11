import { pad } from '../pad.ts'
import type { Collection, Photo } from '../types.ts'

type Props = {
  collection: Collection
  photo: Photo
  gridOpen: boolean
  onNext: () => void
  onOpen: (i: number) => void
}

export function Viewer({ collection, photo, gridOpen, onNext, onOpen }: Props) {
  if (gridOpen) {
    return (
      <ul className="grid">
        {collection.photos.map((p, k) => (
          <li key={p.thumb}>
            <button type="button" className="thumb" aria-label={`Open photo ${pad(k + 1)}`} onClick={() => onOpen(k)}>
              <span className="thumb-frame">
                <img src={p.thumb} alt="" loading="lazy" />
              </span>
              <span className="label">{pad(k + 1)}</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <button type="button" className="stage" aria-label="Next photo" onClick={onNext}>
      <img
        key={photo.full}
        className="photo"
        src={photo.full}
        srcSet={`${photo.full} ${photo.width}w, ${photo.large} ${photo.largeWidth}w`}
        sizes="(max-width: 760px) calc(100vw - 32px), calc(100vw - 304px)"
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
      />
    </button>
  )
}

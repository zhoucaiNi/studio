import { useState } from 'react'
import { DEFAULT_SIZE, PRINT_SIZES } from '../config.ts'
import { pad } from '../pad.ts'
import { buildPrintMailto } from '../printMailto.ts'

type Props = { collectionName: string; photoNumber: number; photoUrl: string }

export function PrintRequest({ collectionName, photoNumber, photoUrl }: Props) {
  const [size, setSize] = useState<string>(DEFAULT_SIZE)
  return (
    <section id="prints" className="prints" aria-labelledby="prints-title">
      <div className="prints-about">
        <h2 id="prints-title">Prints</h2>
        <p className="muted">
          Archival pigment prints, made to order. Pick a size and send a request; I'll reply with a price and timing.
        </p>
      </div>
      <div className="prints-order">
        <p className="label">
          This photo · {collectionName} {pad(photoNumber)}
        </p>
        <div className="sizes">
          {PRINT_SIZES.map((s) => (
            <button key={s} type="button" className="size" aria-pressed={s === size} onClick={() => setSize(s)}>
              {s}
            </button>
          ))}
        </div>
        <a className="request" href={buildPrintMailto(collectionName, photoNumber, size, photoUrl)}>
          Request this print
        </a>
      </div>
    </section>
  )
}

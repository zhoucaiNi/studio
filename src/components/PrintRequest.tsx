import { useState } from 'react'
import { CONTACT_EMAIL, DEFAULT_SIZE, PRINT_SIZES } from '../config.ts'
import { pad } from '../pad.ts'
import { buildCopyText, buildGmailUrl, buildPrintMailto } from '../printMailto.ts'

type Props = { collectionName: string; photoNumber: number; photoUrl: string }

export function PrintRequest({ collectionName, photoNumber, photoUrl }: Props) {
  const [size, setSize] = useState<string>(DEFAULT_SIZE)
  const [copied, setCopied] = useState(false)
  const args = [collectionName, photoNumber, size, photoUrl] as const
  const copy = async () => {
    await navigator.clipboard.writeText(buildCopyText(...args))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
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
        <div className="request-actions">
          <a className="request" href={buildPrintMailto(...args)}>
            Request this print
          </a>
          <a className="alt-action" href={buildGmailUrl(...args)} target="_blank" rel="noreferrer">
            Open in Gmail <span aria-hidden="true">↗</span>
          </a>
          <button type="button" className="alt-action" onClick={copy}>
            {copied ? 'Copied' : 'Copy request'}
          </button>
        </div>
        <p className="muted">
          or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </section>
  )
}

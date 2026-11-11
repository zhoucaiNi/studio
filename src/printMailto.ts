import { CONTACT_EMAIL } from './config.ts'
import { pad } from './pad.ts'

export function buildPrintRequest(collectionName: string, photoNumber: number, size: string, photoUrl: string) {
  const nn = pad(photoNumber)
  return {
    subject: `Print request: ${collectionName} ${nn}`,
    body: [`Collection: ${collectionName}`, `Photo: ${nn}`, `Size: ${size}`, `Link: ${photoUrl}`].join('\n'),
  }
}

type Args = Parameters<typeof buildPrintRequest>

export function buildPrintMailto(...args: Args): string {
  const { subject, body } = buildPrintRequest(...args)
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// For visitors without a mail app: Gmail's web compose window, pre-filled
export function buildGmailUrl(...args: Args): string {
  const { subject, body } = buildPrintRequest(...args)
  const q = new URLSearchParams({ view: 'cm', fs: '1', to: CONTACT_EMAIL, su: subject, body })
  return `https://mail.google.com/mail/?${q.toString().replace(/\+/g, '%20')}`
}

export function buildCopyText(...args: Args): string {
  const { subject, body } = buildPrintRequest(...args)
  return `To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${body}`
}

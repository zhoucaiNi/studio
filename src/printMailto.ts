import { CONTACT_EMAIL } from './config.ts'
import { pad } from './pad.ts'

export function buildPrintMailto(collectionName: string, photoNumber: number, size: string, photoUrl: string): string {
  const nn = pad(photoNumber)
  const subject = `Print request: ${collectionName} ${nn}`
  const body = [`Collection: ${collectionName}`, `Photo: ${nn}`, `Size: ${size}`, `Link: ${photoUrl}`].join('\n')
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

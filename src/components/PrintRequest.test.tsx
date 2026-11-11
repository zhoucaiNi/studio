import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { buildPrintMailto } from '../printMailto.ts'
import { PrintRequest } from './PrintRequest.tsx'

function decode(href: string) {
  const url = new URL(href)
  return {
    to: url.pathname,
    subject: decodeURIComponent(url.searchParams.get('subject') ?? ''),
    body: decodeURIComponent(url.searchParams.get('body') ?? ''),
    raw: href,
  }
}

test('builds the mailto with names that contain &', () => {
  const m = decode(buildPrintMailto('Dusk & Water', 3, '16×20 in', 'https://studio.zhoucai.me/#/dusk-water/3'))
  expect(m.to).toBe('nizhoucai@gmail.com')
  expect(m.subject).toBe('Print request: Dusk & Water 03')
  expect(m.body).toContain('Collection: Dusk & Water')
  expect(m.body).toContain('Photo: 03')
  expect(m.body).toContain('Size: 16×20 in')
  expect(m.body).toContain('Link: https://studio.zhoucai.me/#/dusk-water/3')
})

test('size buttons pick the size used in the request', async () => {
  render(<PrintRequest collectionName="Dusk" photoNumber={1} photoUrl="https://studio.zhoucai.me/#/dusk/1" />)
  expect(screen.getByRole('button', { name: '11×14 in' })).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(screen.getByRole('button', { name: '24×30 in' }))
  expect(screen.getByRole('button', { name: '24×30 in' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: '11×14 in' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('link', { name: 'Request this print' }).getAttribute('href')).toContain('24%C3%9730')
})

test('shows the print copy', () => {
  render(<PrintRequest collectionName="Dusk" photoNumber={1} photoUrl="x" />)
  expect(
    screen.getByText("Archival pigment prints, made to order. Pick a size and send a request; I'll reply with a price and timing."),
  ).toBeInTheDocument()
})

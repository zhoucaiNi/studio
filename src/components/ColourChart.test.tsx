import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { fixture } from '../test/fixture.ts'
import { ColourChart } from './ColourChart.tsx'

const setup = () => {
  const onOpen = vi.fn()
  render(<ColourChart collections={fixture} onOpen={onOpen} />)
  return onOpen
}

test('draws one square per colour group with its photo count', () => {
  setup()
  const squares = screen.getAllByRole('button', { name: /^\d+ photos?, #[0-9a-f]{6}$/ })
  expect(squares).toHaveLength(3) // two near-black photos share a square, red and blue stand alone
  expect(screen.getAllByRole('button', { name: /^2 photos, #/ })).toHaveLength(1)
  expect(screen.getByText('Colour · 4 photos in 3 groups')).toBeInTheDocument()
})

test('opens on the biggest group and lists its photos', () => {
  setup()
  expect(screen.getByRole('button', { name: 'Alpha 01' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Alpha 02' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Alpha 03' })).not.toBeInTheDocument()
})

test('choosing another group lists that group’s photos instead', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: '1 photo, #c4452f' }))
  expect(screen.getByRole('button', { name: 'Alpha 03' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Alpha 01' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '1 photo, #c4452f' })).toHaveAttribute('aria-current', 'true')
})

test('hovering a square also picks it', async () => {
  setup()
  await userEvent.hover(screen.getByRole('button', { name: '1 photo, #2f5fa8' }))
  expect(screen.getByRole('button', { name: 'Beta & Co 01' })).toBeInTheDocument()
})

test('open photo goes to the shown photo in its collection', async () => {
  const onOpen = setup()
  await userEvent.click(screen.getByRole('button', { name: '1 photo, #2f5fa8' }))
  await userEvent.click(screen.getByRole('button', { name: 'open photo' }))
  expect(onOpen).toHaveBeenCalledWith(1, 0)
})

test('picking a photo inside a group changes which one open photo goes to', async () => {
  const onOpen = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Alpha 02' }))
  await userEvent.click(screen.getByRole('button', { name: 'open photo' }))
  expect(onOpen).toHaveBeenCalledWith(0, 1)
})

test('the photos always show in the same panel, whichever group you pick', async () => {
  setup()
  const panel = screen.getByRole('complementary', { name: 'Photos in this colour' })
  expect(within(panel).getByRole('button', { name: 'Alpha 01' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '1 photo, #2f5fa8' }))
  expect(screen.getByRole('complementary', { name: 'Photos in this colour' })).toBe(panel)
  expect(within(panel).getByRole('button', { name: 'Beta & Co 01' })).toBeInTheDocument()
  expect(panel.className).not.toMatch(/left|right|top|bottom/)
})

test('draws the wheel behind the squares: two rings, two diagonals and the axes named in a*/b* terms', () => {
  const { container } = render(<ColourChart collections={fixture} onOpen={vi.fn()} />)
  expect(container.querySelectorAll('.colour-ring')).toHaveLength(2)
  expect(container.querySelectorAll('.colour-diagonal')).toHaveLength(2)
  expect(container.querySelectorAll('.colour-dotted')).toHaveLength(2)
  for (const label of ['yellow +b*', 'blue −b*', 'green −a*', 'red +a*']) expect(screen.getByText(label)).toBeInTheDocument()
})

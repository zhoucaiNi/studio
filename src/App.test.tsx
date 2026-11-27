import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from './App.tsx'
import { fixture } from './test/fixture.ts'

beforeEach(() => {
  history.replaceState(null, '', '/')
})

const counter = () => screen.getByTestId('counter').textContent

test('renders the name', () => {
  render(<App collections={fixture} />)
  expect(screen.getByRole('link', { name: 'Zhoucai Ni' })).toHaveAttribute('href', 'https://zhoucai.me')
})

test('clicking the photo advances', async () => {
  render(<App collections={fixture} />)
  expect(counter()).toBe('01 / 03')
  await userEvent.click(screen.getByRole('button', { name: /Next photo/ }))
  expect(counter()).toBe('02 / 03')
  expect(screen.getByRole('img', { name: 'a photo 2' })).toBeInTheDocument()
})

test('choosing a collection shows its first photo and marks it current', async () => {
  render(<App collections={fixture} />)
  await userEvent.click(screen.getByRole('button', { name: /Beta & Co/ }))
  expect(counter()).toBe('01 / 01')
  expect(screen.getByRole('button', { name: /Beta & Co/ })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByRole('button', { name: /Alpha/ })).not.toHaveAttribute('aria-current')
})

test('thumbnails open the chosen photo and close', async () => {
  render(<App collections={fixture} />)
  await userEvent.click(screen.getByRole('button', { name: 'show thumbnails' }))
  await userEvent.click(screen.getByRole('button', { name: 'Open photo 03' }))
  expect(counter()).toBe('03 / 03')
  expect(screen.queryByRole('button', { name: 'Open photo 01' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'show thumbnails' })).toBeInTheDocument()
})

test('the photo offers the large file to high-density screens', () => {
  render(<App collections={fixture} />)
  const img = screen.getByRole('img', { name: 'a photo 1' })
  expect(img).toHaveAttribute('srcset', '/photos/a/01-full.jpg 2000w, /photos/a/01-large.jpg 3200w')
  expect(img.getAttribute('sizes')).toBeTruthy()
})

test('the sidebar has no Prints or Info links', () => {
  render(<App collections={fixture} />)
  expect(screen.queryByRole('link', { name: 'Prints' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Info' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com/zhouca2')
})

test('an in-page anchor in the URL keeps the photo you were on', () => {
  history.replaceState(null, '', '/#/a/3')
  render(<App collections={fixture} />)
  act(() => {
    history.pushState(null, '', '/#prints')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  expect(counter()).toBe('03 / 03')
})

test('the photo button names the photo for screen readers', () => {
  render(<App collections={fixture} />)
  expect(screen.getByRole('button', { name: 'a photo 1. Next photo' })).toBeInTheDocument()
})

test('Colour in the sidebar opens the colour chart and is the current page', async () => {
  render(<App collections={fixture} />)
  expect(screen.getByRole('button', { name: /^Colour/ })).toHaveTextContent('04')
  await userEvent.click(screen.getByRole('button', { name: /^Colour/ }))
  expect(screen.getByText('Colour · 4 photos in 3 groups')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Colour/ })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByRole('button', { name: /^Alpha\d/ })).not.toHaveAttribute('aria-current')
  expect(screen.queryByTestId('counter')).not.toBeInTheDocument()
  expect(location.hash).toBe('#/colour')
})

test('opening a photo from the chart returns to the viewer on that photo', async () => {
  render(<App collections={fixture} />)
  await userEvent.click(screen.getByRole('button', { name: /^Colour/ }))
  await userEvent.click(screen.getByRole('button', { name: '1 photo, #c4452f' }))
  await userEvent.click(screen.getByRole('button', { name: 'open photo' }))
  expect(counter()).toBe('03 / 03')
  expect(location.hash).toBe('#/a/3')
  expect(screen.getByRole('button', { name: /^Colour/ })).not.toHaveAttribute('aria-current')
})

test('a #/colour link opens the chart', () => {
  history.replaceState(null, '', '/#/colour')
  render(<App collections={fixture} />)
  expect(screen.getByText('Colour · 4 photos in 3 groups')).toBeInTheDocument()
})

test('Colour is its own group in the sidebar, not one of the collections', () => {
  render(<App collections={fixture} />)
  const collections = screen.getByRole('navigation', { name: 'Collections' })
  expect(within(collections).queryByRole('button', { name: /^Colour/ })).not.toBeInTheDocument()
  const everything = screen.getByRole('navigation', { name: 'All photos' })
  expect(within(everything).getByRole('button', { name: /^Colour/ })).toHaveTextContent('04')
})

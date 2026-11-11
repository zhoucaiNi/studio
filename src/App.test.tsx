import { render, screen } from '@testing-library/react'
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
  await userEvent.click(screen.getByRole('button', { name: 'Next photo' }))
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

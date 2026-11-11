import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('renders the name', () => {
  render(<App />)
  expect(screen.getByRole('link', { name: 'Zhoucai Ni' })).toBeInTheDocument()
})

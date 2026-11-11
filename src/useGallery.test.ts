import { act, fireEvent, renderHook } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { fixture } from './test/fixture.ts'
import { useGallery } from './useGallery.ts'

beforeEach(() => {
  history.replaceState(null, '', '/')
})

const start = (hash = '') => {
  history.replaceState(null, '', `/${hash}`)
  return renderHook(() => useGallery(fixture))
}

test('starts from the hash', () => {
  const { result } = start('#/a/2')
  expect(result.current).toMatchObject({ c: 0, i: 1, gridOpen: false })
  expect(result.current.photo).toBe(fixture[0].photos[1])
})

test('next and prev wrap around', () => {
  const { result } = start('#/a/3')
  act(() => result.current.next())
  expect(result.current.i).toBe(0)
  act(() => result.current.prev())
  expect(result.current.i).toBe(2)
})

test('a single-photo collection stays on its photo', () => {
  const { result } = start('#/b/1')
  act(() => result.current.next())
  expect(result.current.i).toBe(0)
  act(() => result.current.prev())
  expect(result.current.i).toBe(0)
})

test('pickCollection opens the first photo and closes the grid', () => {
  const { result } = start('#/a/3')
  act(() => result.current.toggleGrid())
  act(() => result.current.pickCollection(1))
  expect(result.current).toMatchObject({ c: 1, i: 0, gridOpen: false })
  expect(result.current.collection).toBe(fixture[1])
})

test('goTo opens a photo and closes the grid', () => {
  const { result } = start('#/a/1')
  act(() => result.current.toggleGrid())
  expect(result.current.gridOpen).toBe(true)
  act(() => result.current.goTo(2))
  expect(result.current).toMatchObject({ i: 2, gridOpen: false })
})

test('updates the hash as you move', () => {
  const { result } = start('#/a/1')
  act(() => result.current.next())
  expect(location.hash).toBe('#/a/2')
  act(() => result.current.pickCollection(1))
  expect(location.hash).toBe('#/b/1')
})

test('follows hash changes from outside', () => {
  const { result } = start('#/a/1')
  act(() => {
    history.replaceState(null, '', '/#/b/1')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  expect(result.current.c).toBe(1)
})

test('arrow keys move, Escape closes the grid, arrows close it too', () => {
  const { result } = start('#/a/1')
  act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
  expect(result.current.i).toBe(1)
  act(() => void fireEvent.keyDown(window, { key: 'ArrowLeft' }))
  expect(result.current.i).toBe(0)
  act(() => result.current.toggleGrid())
  act(() => void fireEvent.keyDown(window, { key: 'Escape' }))
  expect(result.current.gridOpen).toBe(false)
  act(() => result.current.toggleGrid())
  act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
  expect(result.current).toMatchObject({ i: 1, gridOpen: false })
})

test('ignores keys typed in a text field', () => {
  const { result } = start('#/a/1')
  const input = document.createElement('input')
  document.body.append(input)
  act(() => void fireEvent.keyDown(input, { key: 'ArrowRight' }))
  expect(result.current.i).toBe(0)
  input.remove()
})

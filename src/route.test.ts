import { describe, expect, test } from 'vitest'
import { formatHash, parseHash } from './route.ts'
import { fixture } from './test/fixture.ts'

describe('parseHash', () => {
  test('reads collection and 1-based photo number', () => {
    expect(parseHash('#/a/2', fixture)).toEqual({ c: 0, i: 1 })
    expect(parseHash('#/b/1', fixture)).toEqual({ c: 1, i: 0 })
  })

  test('tolerates case and a trailing slash', () => {
    expect(parseHash('#/A/2', fixture)).toEqual({ c: 0, i: 1 })
    expect(parseHash('#/a/2/', fixture)).toEqual({ c: 0, i: 1 })
  })

  test('missing number opens the first photo', () => {
    expect(parseHash('#/b', fixture)).toEqual({ c: 1, i: 0 })
  })

  test('bad numbers open the first photo', () => {
    for (const h of ['#/a/abc', '#/a/0', '#/a/-1']) expect(parseHash(h, fixture)).toEqual({ c: 0, i: 0 })
  })

  test('numbers past the end clamp to the last photo', () => {
    expect(parseHash('#/a/99', fixture)).toEqual({ c: 0, i: 2 })
  })

  test('unknown or empty hashes open the first collection', () => {
    for (const h of ['#/zzz/2', '', '#', '#/']) expect(parseHash(h, fixture)).toEqual({ c: 0, i: 0 })
  })
})

test('formatHash builds a 1-based hash', () => {
  expect(formatHash(fixture, 1, 0)).toBe('#/b/1')
  expect(formatHash(fixture, 0, 2)).toBe('#/a/3')
})

test('reads percent-encoded slugs', () => {
  const cols = [{ ...fixture[0], slug: 'café' }]
  expect(parseHash('#/caf%C3%A9/2', cols)).toEqual({ c: 0, i: 1 })
})

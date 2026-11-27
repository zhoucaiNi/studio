import { expect, test } from 'vitest'
import { averageHex, groupByColour, labFromHex, placeGroups } from './colour.ts'

test('labFromHex puts white at L100 and reads red and blue on the right axes', () => {
  const white = labFromHex('#ffffff')
  expect(white.l).toBeCloseTo(100, 0)
  expect(white.a).toBeCloseTo(0, 0)
  expect(white.b).toBeCloseTo(0, 0)
  expect(labFromHex('#ff0000').a).toBeGreaterThan(60) // red is +a
  expect(labFromHex('#0000ff').b).toBeLessThan(-60) // blue is -b
  expect(labFromHex('#ffff00').b).toBeGreaterThan(60) // yellow is +b
  expect(labFromHex('#00ff00').a).toBeLessThan(-60) // green is -a
})

test('groupByColour keeps near colours together and far ones apart, biggest group first', () => {
  const items = ['#101013', '#6a7314', '#0d0e0d', '#0f0a0a', '#02136e'].map((hex) => ({ hex }))
  const groups = groupByColour(items)
  expect(groups.map((g) => g.items.length)).toEqual([3, 1, 1])
  expect(groups[0].items.map((i) => i.hex).sort()).toEqual(['#0d0e0d', '#0f0a0a', '#101013'])
})

test('groupByColour merges every colour into one group when the threshold is huge', () => {
  const groups = groupByColour([{ hex: '#ff0000' }, { hex: '#0000ff' }], 1000)
  expect(groups).toHaveLength(1)
})

test('groupByColour of nothing is nothing', () => {
  expect(groupByColour([])).toEqual([])
})

test('a group shows the average colour of its photos', () => {
  expect(averageHex(['#000000', '#ffffff'])).toBe('#808080')
  expect(averageHex(['#102030'])).toBe('#102030')
})

test('placeGroups keeps squares apart and inside the chart', () => {
  const groups = groupByColour(
    ['#101013', '#6a7314', '#8c8b12', '#b0d0ee', '#035299', '#902f4d', '#ececec', '#02136e'].map((hex) => ({ hex })),
  )
  const w = 600
  const h = 400
  const gap = 50
  const spots = placeGroups(groups, { width: w, height: h, gap })
  expect(spots).toHaveLength(groups.length)
  for (const s of spots) {
    expect(s.x).toBeGreaterThanOrEqual(0)
    expect(s.x).toBeLessThanOrEqual(w)
    expect(s.y).toBeGreaterThanOrEqual(0)
    expect(s.y).toBeLessThanOrEqual(h)
  }
  for (let i = 0; i < spots.length; i++)
    for (let j = i + 1; j < spots.length; j++)
      expect(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y)).toBeGreaterThanOrEqual(gap - 1)
})

test('placeGroups puts red to the right and blue below', () => {
  const groups = groupByColour([{ hex: '#c4452f' }, { hex: '#2f5fa8' }])
  const [red, blue] = placeGroups(groups, { width: 600, height: 400, gap: 40 }).map((s, k) => ({ s, g: groups[k] }))
  const centre = { x: 300, y: 200 }
  const redSpot = groups[0].hex === '#c4452f' ? red.s : blue.s
  const blueSpot = groups[0].hex === '#c4452f' ? blue.s : red.s
  expect(redSpot.x).toBeGreaterThan(centre.x)
  expect(blueSpot.y).toBeGreaterThan(centre.y)
})

test('a sky blue, denim, a deep navy and a purple are four different groups, not one blue pile', () => {
  const groups = groupByColour(['#6dafd1', '#46566d', '#012c6c', '#8578b4'].map((hex) => ({ hex })))
  expect(groups).toHaveLength(4)
})

test('shades of the same colour still share a group', () => {
  const groups = groupByColour(['#6dafd1', '#729cd4', '#6e8dab'].map((hex) => ({ hex })))
  expect(groups).toHaveLength(1)
})

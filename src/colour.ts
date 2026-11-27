// Colour maths for the Colour page: photos with similar colours form a group,
// each group is drawn as one square on an a*/b* chart (red +a, green -a, yellow +b, blue -b).

export type Lab = { l: number; a: number; b: number }
export type Group<T> = Lab & { items: T[]; hex: string }

const rgbOf = (hex: string) => [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16))
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

const linear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function labFromRgb(red: number, green: number, blue: number): Lab {
  const [r, g, b] = [red, green, blue].map(linear)
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) }
}

export const labFromHex = (hex: string): Lab => labFromRgb(...(rgbOf(hex) as [number, number, number]))

export function averageHex(hexes: string[]): string {
  const sum = hexes.map(rgbOf).reduce((t, c) => t.map((v, k) => v + c[k]), [0, 0, 0])
  return toHex(sum.map((v) => v / hexes.length))
}

// lightness counts half as much as hue, so a dark blue and a dark grey stay apart less than a blue and a red
const distance = (x: Lab, y: Lab) => Math.hypot(x.a - y.a, x.b - y.b, (x.l - y.l) * 0.5)

// Merge the two closest groups until none are within `threshold`; biggest group first.
export function groupByColour<T extends { hex: string }>(items: T[], threshold = 16): Group<T>[] {
  const groups = items.map((item) => ({ ...labFromHex(item.hex), items: [item], hex: item.hex }))
  for (;;) {
    let best = { i: -1, j: -1, d: Infinity }
    for (let i = 0; i < groups.length; i++)
      for (let j = i + 1; j < groups.length; j++) {
        const d = distance(groups[i], groups[j])
        if (d < best.d) best = { i, j, d }
      }
    if (best.d > threshold) break
    const [x, y] = [groups[best.i], groups[best.j]]
    const n = x.items.length + y.items.length
    const mean = (k: keyof Lab) => (x[k] * x.items.length + y[k] * y.items.length) / n
    const merged = [...x.items, ...y.items]
    groups[best.i] = { l: mean('l'), a: mean('a'), b: mean('b'), items: merged, hex: averageHex(merged.map((m) => m.hex)) }
    groups.splice(best.j, 1)
  }
  return groups.sort((p, q) => q.items.length - p.items.length)
}

// Home spot from a*/b* (the crowded middle is stretched), then pushed apart so squares don't overlap.
export function placeGroups<T>(
  groups: Group<T>[],
  { width, height, gap }: { width: number; height: number; gap: number },
): { x: number; y: number }[] {
  const stretch = (v: number) => Math.sign(v) * Math.min(1, Math.pow(Math.abs(v) / 60, 0.6)) * 0.44
  const home = groups.map((g) => ({ x: width / 2 + stretch(g.a) * width, y: height / 2 - stretch(g.b) * height }))
  const spots = home.map((h) => ({ ...h }))
  const lo = gap / 2
  for (let it = 0; it < 400; it++) {
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++) {
        let dx = spots[j].x - spots[i].x
        let dy = spots[j].y - spots[i].y
        let d = Math.hypot(dx, dy)
        if (d >= gap) continue
        if (d < 0.01) {
          dx = Math.cos(i * 2.4)
          dy = Math.sin(i * 2.4)
          d = 1
        }
        const push = (gap - d) / 2 / d
        spots[i].x -= dx * push
        spots[i].y -= dy * push
        spots[j].x += dx * push
        spots[j].y += dy * push
      }
    spots.forEach((s, k) => {
      s.x += (home[k].x - s.x) * 0.02
      s.y += (home[k].y - s.y) * 0.02
      s.x = Math.min(width - lo, Math.max(lo, s.x))
      s.y = Math.min(height - lo, Math.max(lo, s.y))
    })
  }
  return spots
}

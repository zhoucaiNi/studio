// @vitest-environment node
import { transform } from 'lightningcss'
import { expect, test } from 'vitest'
import css from './styles.css?raw'

// the dev server forgives CSS mistakes that the production minifier rejects (a "*/" inside a comment ended it early
// and broke the deploy), so run the same minifier over the stylesheet
test('styles.css is valid for the production minifier', () => {
  const code = new TextEncoder().encode(css)
  expect(() => transform({ filename: 'styles.css', code, minify: true })).not.toThrow()
})

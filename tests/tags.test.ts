import { describe, expect, test } from 'claude-code/testing'

import { findTags, imageNumbers, tagAtCursor } from '../hooks/tags'

describe('tags', () => {
  test('finds each tag with its position in the draft', () => {
    expect(findTags('see [Image #2] vs [Image #10]')).toEqual([
      { n: 2, start: 4, end: 14 },
      { n: 10, start: 18, end: 29 },
    ])
  })

  test('ignores text that only resembles a tag', () => {
    expect(findTags('[image #1] [Image 1] [Image #] Image #4')).toEqual([])
  })

  test('the cursor is on a tag at either edge, as a paste or click leaves it', () => {
    const tags = findTags('ab [Image #1] cd')
    expect(tagAtCursor(tags, 3)?.n).toBe(1)
    expect(tagAtCursor(tags, 13)?.n).toBe(1)
    expect(tagAtCursor(tags, 2)).toBeUndefined()
    expect(tagAtCursor(tags, 14)).toBeUndefined()
  })

  test('where two tags meet, the one ending there wins', () => {
    expect(tagAtCursor(findTags('[Image #1][Image #2]'), 10)?.n).toBe(1)
  })

  test('image numbers are listed once, in order of first appearance', () => {
    expect(imageNumbers(findTags('[Image #3] [Image #1] [Image #3]'))).toEqual([
      3, 1,
    ])
  })
})

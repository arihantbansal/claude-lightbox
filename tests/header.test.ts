import { describe, expect, test } from 'claude-code/testing'

import { header } from '../hooks/header'
import { HIGH_RES, STANDARD } from '../hooks/tokens'

const image = {
  n: 2,
  path: '/tmp/2.png',
  width: 1920,
  height: 1080,
  bytes: 524_288,
}
const alone = { index: 0, count: 1 }

describe('header', () => {
  test('titles the image with its caption', () => {
    expect(header(image, 'Login page with error', alone, HIGH_RES).title).toBe(
      'Image #2 · Login page with error',
    )
    expect(header(image, undefined, alone, HIGH_RES).title).toBe('Image #2')
  })

  test('gives its size and what the model reads', () => {
    expect(header(image, undefined, alone, HIGH_RES).details).toBe(
      '1920×1080 · 512 KB · ~2.7k tokens',
    )
  })

  test('says where the image sits among several', () => {
    const { details } = header(
      image,
      undefined,
      { index: 1, count: 3 },
      HIGH_RES,
    )
    expect(details).toMatch(/^2 of 3 · /)
  })

  test('says what size it is sent at when the model scales it down', () => {
    const big = { ...image, bytes: 1_153_434 }
    expect(header(big, undefined, alone, STANDARD).details).toBe(
      '1920×1080 · 1.1 MB · sent as 1456×819 · ~1.6k tokens',
    )
  })
})

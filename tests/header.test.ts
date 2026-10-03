import { describe, expect, test } from 'claude-code/testing'

import { headerText } from '../hooks/header'
import { HIGH_RES, STANDARD } from '../hooks/tokens'

const image = {
  n: 2,
  path: '/tmp/2.png',
  width: 1920,
  height: 1080,
  bytes: 524_288,
}

describe('header', () => {
  test('names the image, its size and what the model reads', () => {
    expect(headerText(image, undefined, { index: 0, count: 1 }, HIGH_RES)).toBe(
      'Image #2 · 1920×1080 · 512 KB · ~2.7k tokens',
    )
  })

  test('says where the image sits among several', () => {
    expect(
      headerText(image, undefined, { index: 1, count: 3 }, HIGH_RES),
    ).toContain('Image #2 · 2 of 3 ·')
  })

  test('says what size it is sent at when the model scales it down', () => {
    expect(
      headerText(
        { ...image, bytes: 1_153_434 },
        undefined,
        { index: 0, count: 1 },
        STANDARD,
      ),
    ).toBe('Image #2 · 1920×1080 · 1.1 MB · sent as 1456×819 · ~1.6k tokens')
  })

  test('puts the caption right after the image number', () => {
    expect(
      headerText(
        image,
        'Login page with error',
        { index: 0, count: 1 },
        HIGH_RES,
      ),
    ).toMatch(/^Image #2 · Login page with error · 1920×1080/)
  })
})

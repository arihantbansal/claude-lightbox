import { describe, expect, test } from 'claude-code/testing'

import {
  HIGH_RES,
  imageTokens,
  STANDARD,
  sentSize,
  tierOf,
} from '../hooks/tokens'

// Expected values are the examples in Anthropic's vision docs.
describe('tokens', () => {
  test('an image that fits its tier is sent as it is', () => {
    const size = { width: 1920, height: 1080 }
    expect(sentSize(size, HIGH_RES)).toEqual(size)
    expect(imageTokens(size)).toBe(2691)
  })

  test('an image over its tier is scaled to the largest size that fits', () => {
    const fullHd = { width: 1920, height: 1080 }
    expect(sentSize(fullHd, STANDARD)).toEqual({ width: 1456, height: 819 })
    expect(imageTokens(sentSize(fullHd, STANDARD))).toBe(1560)

    // A Retina screenshot: the token limit, not the edge limit, scales it.
    const screenshot = { width: 2850, height: 1672 }
    expect(sentSize(screenshot, HIGH_RES)).toEqual({
      width: 2520,
      height: 1478,
    })
    expect(imageTokens(sentSize(screenshot, HIGH_RES))).toBe(4770)

    const fourK = { width: 3840, height: 2160 }
    expect(sentSize(fourK, HIGH_RES)).toEqual({ width: 2576, height: 1449 })
    expect(imageTokens(sentSize(fourK, HIGH_RES))).toBe(4784)

    // The docs' table says 1269×952; their reference code, which this ports,
    // gives 1270×952. Both cost 1564 tokens.
    const photo = { width: 2000, height: 1500 }
    expect(sentSize(photo, STANDARD)).toEqual({ width: 1270, height: 952 })
    expect(imageTokens(sentSize(photo, STANDARD))).toBe(1564)
  })

  test('a tall image is scaled along its height', () => {
    const page = { width: 1075, height: 1520 }
    expect(sentSize(page, STANDARD)).toEqual({ width: 924, height: 1307 })
  })

  test('Claude 4.7 and later read at high resolution, earlier at standard', () => {
    expect(tierOf('claude-opus-5-5')).toBe(HIGH_RES)
    expect(tierOf('Opus 4.7')).toBe(HIGH_RES)
    expect(tierOf('claude-haiku-4-5-20251001')).toBe(STANDARD)
    expect(tierOf('claude-sonnet-4-6')).toBe(STANDARD)
    expect(tierOf('claude-3-5-sonnet-20241022')).toBe(STANDARD)
  })

  test('a model named without a version is taken to be current', () => {
    expect(tierOf('opus')).toBe(HIGH_RES)
  })
})

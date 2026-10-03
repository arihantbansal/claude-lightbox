import { describe, expect, test } from 'claude-code/testing'

import { parseOd, pngSize } from '../hooks/png'
import { odOutput, pngHead } from './fixtures/png-head'

describe('png', () => {
  test('reads the size from the IHDR header', () => {
    expect(pngSize(pngHead(2850, 1672))).toEqual({ width: 2850, height: 1672 })
  })

  test('is null for bytes that are not a PNG', () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(20)])
    expect(pngSize(jpeg)).toBeNull()
    expect(pngSize(pngHead(2850, 1672).slice(0, 20))).toBeNull()
  })

  test('parses od output back into the bytes it printed', () => {
    const head = pngHead(640, 480)
    expect(parseOd(odOutput(head))).toEqual(head)
  })
})

import { describe, expect, test } from 'claude-code/testing'

import { fitImage, fitThumbnails } from '../hooks/fit'

const square = { width: 500, height: 500 }

describe('fit', () => {
  test('a picture fills the height when the width allows, cells being tall', () => {
    expect(fitImage(square, { columns: 100, rows: 10 })).toEqual({
      columns: 20,
      rows: 10,
    })
  })

  test('a wide picture fills the width and gives up rows', () => {
    expect(
      fitImage({ width: 3000, height: 500 }, { columns: 40, rows: 20 }),
    ).toEqual({ columns: 40, rows: 3 })
  })

  test('never smaller than one cell, nor larger than the Image takes', () => {
    expect(
      fitImage({ width: 100, height: 4000 }, { columns: 80, rows: 10 }),
    ).toEqual({ columns: 1, rows: 10 })
    expect(fitImage(square, { columns: 1000, rows: 1000 })).toEqual({
      columns: 255,
      rows: 128,
    })
  })

  test('thumbnails shrink together until the row fits', () => {
    // Three 6-row squares take 3 * (12 + 3) = 45 columns; 5 rows take 39.
    const tiles = fitThumbnails(
      [square, square, square],
      { columns: 40, rows: 6 },
      3,
    )
    expect(tiles.map(tile => tile.cells)).toEqual([
      { columns: 10, rows: 5 },
      { columns: 10, rows: 5 },
      { columns: 10, rows: 5 },
    ])
    expect(tiles[0]?.image).toBe(square)
  })
})

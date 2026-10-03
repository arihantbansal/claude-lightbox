import type { Size } from './png'

/** A box of terminal cells. */
export type Cells = { columns: number; rows: number }

// A terminal cell is about twice as tall as it is wide.
const CELL_ASPECT = 2
// The Image element takes 1 to 255 cells each way.
const MAX_CELLS = 255

/** The largest box within `bounds` that keeps the picture's shape. */
export function fitImage(size: Size, bounds: Cells): Cells {
  const maxColumns = Math.min(bounds.columns, MAX_CELLS)
  const maxRows = Math.min(bounds.rows, MAX_CELLS)
  const columnsPerRow = (CELL_ASPECT * size.width) / size.height
  const columns = Math.min(maxColumns, Math.round(maxRows * columnsPerRow))
  const rows = Math.min(maxRows, Math.round(columns / columnsPerRow))
  return { columns: Math.max(columns, 1), rows: Math.max(rows, 1) }
}

const THUMBNAIL_ROWS = 6
const THUMBNAIL_MAX_COLUMNS = 30

/**
 * A thumbnail for each image in one row, all the same height and each its
 * own width, shrunk together until the row fits `bounds.columns` with
 * `tileColumns` more per tile for its border and gap. At one row tall they
 * stop shrinking and the band clips what's left.
 */
export function fitThumbnails<T extends Size>(
  images: readonly T[],
  bounds: Cells,
  tileColumns: number,
): { image: T; cells: Cells }[] {
  const row = (rows: number) =>
    images.map(image => ({
      image,
      cells: fitImage(image, { columns: THUMBNAIL_MAX_COLUMNS, rows }),
    }))
  const width = (tiles: { cells: Cells }[]) =>
    tiles.reduce((total, { cells }) => total + cells.columns + tileColumns, 0)

  let rows = Math.max(Math.min(THUMBNAIL_ROWS, bounds.rows), 1)
  while (rows > 1 && width(row(rows)) > bounds.columns) rows -= 1
  return row(rows)
}

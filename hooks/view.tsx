import type { Elements, RenderElement } from 'claude-code'

import type { PastedImage } from '../types'
import { fitImage, fitThumbnails } from './fit'

type Ui = Elements['terminal']
type Band = { columns: number; rows: number }

// A rounded border takes a cell on every side.
const BORDER = 2

/** One image as large as the band allows, under a line about it. */
export function expanded(
  { Box, Image, Text }: Ui,
  image: PastedImage,
  header: string,
  band: Band,
): RenderElement {
  const cells = fitImage(image, {
    columns: band.columns - BORDER - 2,
    rows: band.rows - BORDER - 1,
  })
  return (
    <Box width={band.columns} justifyContent="center">
      <Box
        flexDirection="column"
        alignItems="center"
        paddingX={1}
        borderStyle="round"
        borderDimColor
      >
        <Text dimColor wrap="truncate-end">
          {header}
        </Text>
        <Image
          key={`image-${image.n}`}
          source={{ file: image.path, format: 'png' }}
          columns={cells.columns}
          rows={cells.rows}
          alt={`[Image #${image.n}]`}
        />
      </Box>
    </Box>
  )
}

const GAP = 1

/**
 * Every image small, in one row, each over its tag's number and caption, cut
 * to the tile's width.
 */
export function thumbnails(
  { Box, Image, Text }: Ui,
  images: readonly PastedImage[],
  captions: ReadonlyMap<number, string>,
  band: Band,
): RenderElement {
  const tiles = fitThumbnails(
    images,
    { columns: band.columns, rows: band.rows - BORDER - 1 },
    BORDER + GAP,
  )
  return (
    <Box columnGap={GAP}>
      {tiles.map(({ image, cells }) => (
        <Box
          key={`tile-${image.n}`}
          flexDirection="column"
          alignItems="center"
          borderStyle="round"
          borderDimColor
        >
          <Image
            key={`thumbnail-${image.n}`}
            source={{ file: image.path, format: 'png' }}
            columns={cells.columns}
            rows={cells.rows}
            alt={`[Image #${image.n}]`}
          />
          <Box width={cells.columns}>
            <Text dimColor wrap="truncate-end">
              {[`#${image.n}`, captions.get(image.n)].filter(Boolean).join(' ')}
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

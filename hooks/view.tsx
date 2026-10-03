import type { Elements, RenderElement } from 'claude-code'

import type { PastedImage } from '../types'
import { fitImage, fitThumbnails } from './fit'
import type { Header } from './header'

type Ui = Elements['terminal']
type Band = { columns: number; rows: number }

// A rounded border takes a cell on every side.
const BORDER = 2

// The header's title and details lines.
const HEADER_ROWS = 2

/**
 * One image as large as the band allows, under its header, in a frame as
 * wide as the wider of the two.
 */
export function expanded(
  { Box, Image, Text }: Ui,
  image: PastedImage,
  { title, details }: Header,
  band: Band,
): RenderElement {
  const cells = fitImage(image, {
    columns: band.columns - BORDER - 2,
    rows: band.rows - BORDER - HEADER_ROWS,
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
        <Text bold wrap="truncate-end">
          {title}
        </Text>
        <Text dimColor wrap="truncate-end">
          {details}
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
 * Every image small, in one row of tiles of equal height: each picture
 * centered in its tile, over its tag's number and caption cut to its width,
 * so the labels line up.
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
          <Box flexGrow={1} alignItems="center">
            <Image
              key={`thumbnail-${image.n}`}
              source={{ file: image.path, format: 'png' }}
              columns={cells.columns}
              rows={cells.rows}
              alt={`[Image #${image.n}]`}
            />
          </Box>
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

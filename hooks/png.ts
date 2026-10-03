export type Size = { width: number; height: number }

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/**
 * A PNG's pixel size from its first 24 bytes: the signature, then the IHDR
 * chunk, whose width and height are big-endian at offsets 16 and 20. Null
 * when the bytes aren't a PNG.
 */
export function pngSize(head: Uint8Array): Size | null {
  if (head.length < 24 || SIGNATURE.some((byte, i) => head[i] !== byte)) {
    return null
  }
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength)
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  return width > 0 && height > 0 ? { width, height } : null
}

/** Bytes from `od -An -tx1` output: hex pairs separated by whitespace. */
export function parseOd(output: string): Uint8Array {
  const pairs = output.trim().split(/\s+/).filter(Boolean)
  return Uint8Array.from(pairs, pair => Number.parseInt(pair, 16))
}

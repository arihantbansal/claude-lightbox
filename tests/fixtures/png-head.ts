/** The first 24 bytes of a PNG of the given size: signature, then IHDR. */
export function pngHead(width: number, height: number): Uint8Array {
  const head = new Uint8Array(24)
  head.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  head.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8)
  const view = new DataView(head.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return head
}

/** `bytes` as `od -An -tx1` prints them: 16 per line, space-separated. */
export function odOutput(bytes: Uint8Array): string {
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'))
  const lines: string[] = []
  for (let i = 0; i < hex.length; i += 16) {
    lines.push(`           ${hex.slice(i, i + 16).join(' ')}`)
  }
  return `${lines.join('\n')}\n`
}

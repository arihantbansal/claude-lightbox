/**
 * One `[Image #n]` tag in the prompt draft, as UTF-16 offsets like the
 * prompt's cursor.
 */
export type ImageTag = { n: number; start: number; end: number }

const TAG = /\[Image #(\d+)\]/g

export function findTags(draft: string): ImageTag[] {
  return Array.from(draft.matchAll(TAG), match => ({
    n: Number(match[1]),
    start: match.index,
    end: match.index + match[0].length,
  }))
}

/**
 * The tag the cursor touches. The prompt treats a tag as one unit: the
 * cursor stops only at its edges, a click puts it at the end, and a paste
 * leaves it there. So a cursor at either edge is on the tag, and where two
 * tags meet, the one ending there wins.
 */
export function tagAtCursor(
  tags: readonly ImageTag[],
  cursor: number,
): ImageTag | undefined {
  return (
    tags.find(tag => tag.end === cursor) ??
    tags.find(tag => tag.start <= cursor && cursor < tag.end)
  )
}

/** Each image number the tags name, once, in order of first appearance. */
export function imageNumbers(tags: readonly ImageTag[]): number[] {
  return [...new Set(tags.map(tag => tag.n))]
}

import type { Size } from './png'

/**
 * A model's image limits. Claude 4.7 and later read images at high
 * resolution; earlier models at standard. From
 * https://platform.claude.com/docs/en/build-with-claude/vision
 */
export type Tier = { maxEdge: number; maxTokens: number }

export const HIGH_RES: Tier = { maxEdge: 2576, maxTokens: 4784 }
export const STANDARD: Tier = { maxEdge: 1568, maxTokens: 1568 }

const PATCH = 28

/**
 * The tier for a model id or display name (`claude-haiku-4-5-20251001`,
 * `Opus 4.7`). A name with no version, such as an alias, is taken to be a
 * current model.
 */
export function tierOf(model: string): Tier {
  const version = /(\d+)[.-](\d{1,2})(?!\d)/.exec(model)
  if (!version) return HIGH_RES
  const major = Number(version[1])
  const minor = Number(version[2])
  return major > 4 || (major === 4 && minor >= 7) ? HIGH_RES : STANDARD
}

/** Visual tokens an image costs: one per 28×28 patch. */
export function imageTokens({ width, height }: Size): number {
  return Math.ceil(width / PATCH) * Math.ceil(height / PATCH)
}

/**
 * The size Claude scales an image to before reading it: unchanged when it
 * fits the tier, else the largest aspect-preserving size that does. A port
 * of the reference implementation in
 * https://platform.claude.com/docs/en/build-with-claude/vision-coordinates
 */
export function sentSize(size: Size, tier: Tier): Size {
  const fits = (width: number, height: number) =>
    Math.ceil(width / PATCH) * PATCH <= tier.maxEdge &&
    Math.ceil(height / PATCH) * PATCH <= tier.maxEdge &&
    imageTokens({ width, height }) <= tier.maxTokens

  const { width, height } = size
  if (fits(width, height)) return size
  if (height > width) {
    const turned = sentSize({ width: height, height: width }, tier)
    return { width: turned.height, height: turned.width }
  }
  // Binary search along the long edge: lo always fits, hi never does.
  const aspect = width / height
  const heightAt = (w: number) => Math.max(roundHalfEven(w / aspect), 1)
  let lo = 1
  let hi = width
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (fits(mid, heightAt(mid))) lo = mid
    else hi = mid
  }
  return { width: lo, height: heightAt(lo) }
}

/** Rounds to the nearest integer, ties to even, as the reference does. */
function roundHalfEven(x: number): number {
  const floor = Math.floor(x)
  const fraction = x - floor
  if (fraction !== 0.5) return Math.round(x)
  return floor % 2 === 0 ? floor : floor + 1
}

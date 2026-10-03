import type { PastedImage } from '../types'
import { imageTokens, sentSize, type Tier } from './tokens'

/**
 * The line above a large preview: which image, what it shows, its size, and
 * what the model will read: `Image #4 · Login page with error · 2 of 3 ·
 * 2850×1672 · 1.1 MB · sent as 2520×1478 · ~4.8k tokens`.
 */
export function headerText(
  image: PastedImage,
  caption: string | undefined,
  position: { index: number; count: number },
  tier: Tier,
): string {
  const sent = sentSize(image, tier)
  const isScaled = sent.width !== image.width || sent.height !== image.height
  return [
    `Image #${image.n}`,
    caption,
    position.count > 1 && `${position.index + 1} of ${position.count}`,
    `${image.width}×${image.height}`,
    fileSize(image.bytes),
    isScaled && `sent as ${sent.width}×${sent.height}`,
    `~${tokenCount(imageTokens(sent))} tokens`,
  ]
    .filter(Boolean)
    .join(' · ')
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function tokenCount(tokens: number): string {
  return tokens < 1000 ? String(tokens) : `${(tokens / 1000).toFixed(1)}k`
}

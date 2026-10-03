/** An image pasted into the prompt, as Claude Code cached it. */
export type PastedImage = {
  /** The number in its `[Image #n]` tag. */
  n: number
  /** Absolute path of the cached PNG. */
  path: string
  width: number
  height: number
  /** File size in bytes. */
  bytes: number
}

/** What the band shows: the draft's images, and the one to show large. */
export type Shown = {
  images: PastedImage[]
  /** The `n` of the image whose tag touches the cursor, or null. */
  focused: number | null
}

/** A pasted image's caption, as the caption run left it. */
export type Caption =
  | { status: 'pending' }
  | { status: 'done'; text: string }
  | { status: 'failed' }

declare module 'claude-code' {
  interface PluginState {
    lightbox: {
      shown: Shown
      /** Captions by image path. */
      captions: Record<string, Caption>
    }
  }
}

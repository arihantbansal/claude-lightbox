import type { EngineInterface, PromptBox, Register } from 'claude-code'
import { atom, read, update } from 'claude-code'

import type { Caption, PastedImage, Shown } from '../types'
import {
  type CaptionModel,
  captionCommand,
  captionLabel,
  captionModelOf,
  cleanCaption,
} from './captions'
import { headerText } from './header'
import { parseOd, pngSize } from './png'
import { findTags, imageNumbers, tagAtCursor } from './tags'
import { tierOf } from './tokens'
import { expanded, thumbnails } from './view'

// Pasting raises no prompt.edit and a click on a tag only moves the cursor,
// so the prompt is also read on a timer.
const POLL_MS = 150
// Below this the band can't show a picture under its border and header.
const MIN_ROWS = 4
// A caption run usually takes about five seconds.
const CAPTION_TIMEOUT_MS = 60_000

const EMPTY: Shown = { images: [], focused: null }
const shown = atom({ plugin: 'lightbox', key: 'shown' } as const, EMPTY)
const captions = atom(
  { plugin: 'lightbox', key: 'captions' } as const,
  {} as Record<string, Caption>,
)

let isActive = false
let lastWritten = ''
let pending: PromptBox | undefined
let isSyncing = false

// The session's image folder, once found. The project folder is named after
// the directory the session started in, which may not be the current one, so
// it is found by the session id instead.
let found: { sessionId: string; path: string } | undefined
// A cached file never changes, so each is read once; null marks one that
// exists but isn't a readable PNG, so it isn't read again.
const readImages = new Map<string, PastedImage | null>()

let captionModel: CaptionModel | null = null
// Image paths waiting for a caption run, oldest first; runs go one at a time.
const captionQueue: string[] = []
let isCaptioning = false

export const register: Register = (on, options) => {
  const showsThumbnails = options.collapsedView !== 'none'
  captionModel = captionModelOf(options.captionModel)

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    // The desktop app previews pasted images itself. The check also keeps a
    // caption run, itself a headless Claude Code, from captioning anything.
    isActive = e.isInteractive && e.surface === 'terminal'
    if (isActive) {
      // A reload drops the runs in flight; their images are captioned again.
      await update($, captions, current => withoutPending(current))
      $.clock.every(POLL_MS, () => poll($))
    }
    return result
  })

  on('prompt.edit', async ($, e, next) => {
    const box = await next(e)
    if (isActive) await sync($, box)
    return box
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.hasSurvey) return next(e)
    const band = { columns: e.props.bodyColumns, rows: e.props.maxRows }
    if (band.rows < MIN_ROWS) return next(e)

    const { images, focused } = await read($, shown)
    const byPath = await read($, captions)
    const ui = $.ui.resolve(e)
    const index = images.findIndex(image => image.n === focused)
    const image = images[index]
    if (image) {
      const tier = tierOf(await $.session.model())
      const caption = captionLabel(byPath[image.path])
      const position = { index, count: images.length }
      const header = headerText(image, caption, position, tier)
      return expanded(ui, image, header, band)
    }
    if (showsThumbnails && images.length > 0) {
      const labels = new Map<number, string>()
      for (const { n, path } of images) {
        const label = captionLabel(byPath[path])
        if (label) labels.set(n, label)
      }
      return thumbnails(ui, images, labels, band)
    }
    return next(e)
  })
}

async function poll($: EngineInterface) {
  await sync($, await $.prompt.read())
}

// Applies the newest box only, one at a time, so a slow read can't land after
// a newer one. Never throws: it runs inside the prompt's own edits, and a
// failed read just leaves the band as it was until the next poll.
async function sync($: EngineInterface, box: PromptBox) {
  pending = box
  if (isSyncing) return
  isSyncing = true
  try {
    while (pending) {
      const latest = pending
      pending = undefined
      await apply($, latest)
    }
  } catch (error) {
    $.ui.log(`lightbox: ${String(error)}`, { to: 'debug' })
  } finally {
    isSyncing = false
  }
}

async function apply($: EngineInterface, box: PromptBox) {
  const tags = findTags(box.text)
  const images = await cachedImages($, imageNumbers(tags))
  const n = tagAtCursor(tags, box.cursor)?.n
  const next: Shown = {
    images,
    focused: images.some(image => image.n === n) ? (n ?? null) : null,
  }
  const key = JSON.stringify(next)
  if (key === lastWritten) return
  lastWritten = key
  await update($, shown, () => next)
  await queueCaptions($, images)
}

async function queueCaptions($: EngineInterface, images: PastedImage[]) {
  if (captionModel === null) return
  const known = await read($, captions)
  const paths = images
    .map(image => image.path)
    .filter(path => known[path] === undefined)
  if (paths.length === 0) return
  await update($, captions, current => {
    const next = { ...current }
    for (const path of paths) next[path] = { status: 'pending' }
    return next
  })
  captionQueue.push(...paths)
  void runCaptions($)
}

// Runs the queued captions one at a time, in the background: each takes
// seconds, and the band redraws as each lands.
async function runCaptions($: EngineInterface) {
  if (isCaptioning) return
  isCaptioning = true
  try {
    for (let path = captionQueue.shift(); path; path = captionQueue.shift()) {
      const caption = await captionImage($, path)
      await update($, captions, current => ({ ...current, [path]: caption }))
    }
  } catch (error) {
    $.ui.log(`lightbox: ${String(error)}`, { to: 'debug' })
  } finally {
    isCaptioning = false
  }
}

async function captionImage(
  $: EngineInterface,
  path: string,
): Promise<Caption> {
  if (captionModel === null) return { status: 'failed' }
  const slash = path.lastIndexOf('/')
  const command = captionCommand(captionModel, path.slice(slash + 1))
  const run = await $.process
    .run(command, { cwd: path.slice(0, slash), timeoutMs: CAPTION_TIMEOUT_MS })
    .catch((error: unknown) => ({
      exitCode: -1,
      stdout: '',
      stderr: String(error),
    }))
  const text = run.exitCode === 0 ? cleanCaption(run.stdout) : null
  if (text) return { status: 'done', text }
  $.ui.log(
    `lightbox: no caption for ${path} (exit ${run.exitCode}): ${run.stderr.trim()}`,
    { to: 'debug' },
  )
  return { status: 'failed' }
}

function withoutPending(
  byPath: Record<string, Caption>,
): Record<string, Caption> {
  return Object.fromEntries(
    Object.entries(byPath).filter(
      ([, caption]) => caption.status !== 'pending',
    ),
  )
}

/**
 * The cached images numbered `numbers`, in that order, leaving out any not
 * written yet. Claude Code caches each paste as
 * `<tmp>/<project>/<session>/images/<n>.png`.
 */
async function cachedImages(
  $: EngineInterface,
  numbers: readonly number[],
): Promise<PastedImage[]> {
  if (numbers.length === 0) return []
  const dir = await imagesDir($)
  if (dir === undefined) return []
  const images: PastedImage[] = []
  for (const n of numbers) {
    const path = `${dir}/${n}.png`
    if (!readImages.has(path)) {
      // undefined: not written yet, so the next call looks again.
      const image = await readImage($, n, path)
      if (image !== undefined) readImages.set(path, image)
    }
    const image = readImages.get(path)
    if (image) images.push(image)
  }
  return images
}

async function imagesDir($: EngineInterface): Promise<string | undefined> {
  const sessionId = await $.session.id()
  if (found?.sessionId === sessionId) return found.path
  const root = await tmpRoot($)
  const entries = await $.fs.list(root).catch(() => [])
  for (const entry of entries) {
    const path = `${root}/${entry.name}/${sessionId}/images`
    if (entry.kind === 'dir' && (await $.fs.exists(path))) {
      found = { sessionId, path }
      return path
    }
  }
  return undefined
}

async function tmpRoot($: EngineInterface): Promise<string> {
  const configured = await $.env.get('CLAUDE_CODE_TMPDIR')
  if (configured) return configured
  const { stdout } = await $.process.run(['id', '-u'])
  return `/tmp/claude-${stdout.trim()}`
}

async function readImage(
  $: EngineInterface,
  n: number,
  path: string,
): Promise<PastedImage | null | undefined> {
  const stat = await $.fs.stat(path).catch(() => undefined)
  if (stat === undefined) return undefined
  if (stat.kind !== 'file') return null
  // The header alone, so a large screenshot isn't copied in to read 24 bytes.
  const { exitCode, stdout } = await $.process.run([
    'od',
    '-An',
    '-tx1',
    '-N24',
    path,
  ])
  const size = exitCode === 0 ? pngSize(parseOd(stdout)) : null
  return size ? { n, path, ...size, bytes: stat.size } : null
}

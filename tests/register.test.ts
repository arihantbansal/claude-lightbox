import type { On } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'

import { odOutput, pngHead } from './fixtures/png-head'

const ROOT = '/tmp/claude-501'
const IMAGES = `${ROOT}/-work/sess-1/images`
const POLL_MS = 150

const BAND = {
  plugin: 'lightbox',
  surface: 'terminal',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  viewport: { columns: 120, rows: 50 },
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

type CaptionRun = {
  argv: readonly string[]
  cwd: string | undefined
  /** Ends the run with this output and exit code. */
  finish: (stdout: string, exitCode?: number) => void
}

const ran = (exitCode: number, stdout: string) => ({
  value: {
    exitCode,
    stdout,
    stderr: '',
    isStdoutTruncated: false,
    isStderrTruncated: false,
  },
})

/**
 * Stands in for Claude Code beneath the mod: a prompt box the test sets, an
 * image cache holding a 1920×1080 PNG for each of `cached`, and caption runs
 * that wait until the test finishes them.
 */
function world(on: On, cached: readonly number[]) {
  const box = { text: '', cursor: 0 }
  const captionRuns: CaptionRun[] = []
  const clock = mock.clock(on)
  const entry = { size: 0, mtimeMs: 0, isLink: false }
  const isCached = (path: string) =>
    cached.some(n => path === `${IMAGES}/${n}.png`)

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('prompt.read', () => ({ value: { ...box } }))
  on('env.get', () => ({ value: undefined }))
  on('fs.list', () => ({
    value: [
      { name: '-other', kind: 'dir', ...entry },
      { name: '-work', kind: 'dir', ...entry },
    ],
  }))
  on('fs.exists', (_, e) => ({ value: e.path === IMAGES }))
  on('fs.stat', (_, e) =>
    isCached(e.path)
      ? { value: { kind: 'file', size: 524_288, mtimeMs: 0, isLink: false } }
      : { deny: `ENOENT: ${e.path}` },
  )
  on('process.run', (_, e) => {
    if (e.argv[0] === 'id') return ran(0, '501\n')
    if (e.argv[0] === 'od') return ran(0, odOutput(pngHead(1920, 1080)))
    return new Promise(resolve => {
      captionRuns.push({
        argv: e.argv,
        cwd: e.init?.cwd,
        finish: (stdout, exitCode = 0) => resolve(ran(exitCode, stdout)),
      })
    })
  })
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))

  /** Sets the prompt box and lets the mod's next poll read it. */
  async function type(text: string, cursor = text.length) {
    box.text = text
    box.cursor = cursor
    await clock.advance(POLL_MS)
  }
  return { type, captionRuns, settle: () => clock.advance(0) }
}

const START = {
  surface: 'terminal',
  isInteractive: true,
  cwd: '/work',
} as const

describe('register', () => {
  test('a pasted image shows large, with its header', async ($, on) => {
    const { type } = world(on, [1])
    await $.session.start(START)
    await type('[Image #1]')

    const ui = await $.ui.mount(BAND)
    expect((await ui.find({ key: 'image-1' }))?.props).toMatchObject({
      source: { file: `${IMAGES}/1.png`, format: 'png' },
    })
    expect(
      await ui.find({ type: 'Text', text: /^1920×1080 · 512 KB/ }),
    ).toBeDefined()
  })

  test('typing collapses it to thumbnails; the cursor on a tag opens it again', async ($, on) => {
    const { type } = world(on, [1, 2])
    await $.session.start(START)

    await type('[Image #1] [Image #2] hi')
    let ui = await $.ui.mount(BAND)
    expect(await ui.find({ key: 'thumbnail-1' })).toBeDefined()
    expect(await ui.find({ key: 'thumbnail-2' })).toBeDefined()
    expect(await ui.find({ key: 'image-1' })).toBeUndefined()
    await ui.unmount()

    // A click on the second tag leaves the cursor at its end.
    await type('[Image #1] [Image #2] hi', 21)
    ui = await $.ui.mount(BAND)
    expect(await ui.find({ key: 'image-2' })).toBeDefined()
    expect(
      await ui.find({ type: 'Text', text: /^2 of 2 · 1920×1080/ }),
    ).toBeDefined()
  })

  test('sending the prompt clears the band', async ($, on) => {
    const { type } = world(on, [1])
    await $.session.start(START)
    await type('[Image #1]')
    await type('')

    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  })

  test('an image not cached yet appears once its file is written', async ($, on) => {
    const cached: number[] = []
    const { type } = world(on, cached)
    await $.session.start(START)
    await type('[Image #1]')
    let ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    await ui.unmount()

    cached.push(1)
    await type('[Image #1]')
    ui = await $.ui.mount(BAND)
    expect(await ui.find({ key: 'image-1' })).toBeDefined()
  })

  test(
    'with the collapsed view off, typing hides the images',
    { options: { collapsedView: 'none' } },
    async ($, on) => {
      const { type } = world(on, [1])
      await $.session.start(START)
      await type('[Image #1] hi')

      const ui = await $.ui.mount(BAND)
      expect(await ui.find({ type: 'Image' })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
    },
  )

  test('a caption is written in the background and lands in the header', async ($, on) => {
    const { type, captionRuns, settle } = world(on, [1])
    await $.session.start(START)
    await type('[Image #1]')

    let ui = await $.ui.mount(BAND)
    expect(
      await ui.find({ type: 'Text', text: 'Image #1 · describing…' }),
    ).toBeDefined()
    await ui.unmount()

    expect(captionRuns).toHaveLength(1)
    const [run] = captionRuns
    expect(run?.argv).toContain('sonnet')
    expect(run?.argv.at(-1)).toBe('Caption the image in ./1.png.')
    expect(run?.cwd).toBe(IMAGES)

    run?.finish('"Login page with error."\n')
    await settle()
    ui = await $.ui.mount(BAND)
    expect(
      await ui.find({
        type: 'Text',
        text: 'Image #1 · Login page with error',
      }),
    ).toBeDefined()
  })

  test('thumbnails carry their captions', async ($, on) => {
    const { type, captionRuns, settle } = world(on, [1])
    await $.session.start(START)
    await type('[Image #1] hi')
    captionRuns[0]?.finish('Login page with error')
    await settle()

    const ui = await $.ui.mount(BAND)
    expect(
      await ui.find({ type: 'Text', text: /^#1 Login page/ }),
    ).toBeDefined()
  })

  test('a failed caption run leaves the header without one', async ($, on) => {
    const { type, captionRuns, settle } = world(on, [1])
    await $.session.start(START)
    await type('[Image #1]')
    captionRuns[0]?.finish('', 1)
    await settle()

    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Text', text: /^Image #1$/ })).toBeDefined()
  })

  test('each image is captioned once', async ($, on) => {
    const { type, captionRuns, settle } = world(on, [1, 2])
    await $.session.start(START)
    await type('[Image #1]')
    await type('[Image #1] [Image #2]')
    await type('[Image #1] [Image #2] hi')
    for (const run of captionRuns) run.finish('Something')
    await settle()
    await type('[Image #1] [Image #2] hi there')

    expect(captionRuns.map(run => run.argv.at(-1))).toEqual([
      'Caption the image in ./1.png.',
      'Caption the image in ./2.png.',
    ])
  })

  test(
    'with captions off, nothing is run',
    { options: { captionModel: 'off' } },
    async ($, on) => {
      const { type, captionRuns } = world(on, [1])
      await $.session.start(START)
      await type('[Image #1]')

      expect(captionRuns).toHaveLength(0)
      const ui = await $.ui.mount(BAND)
      expect(await ui.find({ type: 'Text', text: /^Image #1$/ })).toBeDefined()
    },
  )
})

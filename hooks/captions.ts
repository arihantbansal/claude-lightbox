import type { Caption } from '../types'

export type CaptionModel = 'sonnet' | 'haiku'

/** The caption model setting: a model, or null when captions are off. */
export function captionModelOf(setting: unknown): CaptionModel | null {
  if (setting === 'off') return null
  return setting === 'haiku' ? 'haiku' : 'sonnet'
}

const SYSTEM_PROMPT =
  'You caption images a person pasted into a coding assistant, so they can ' +
  'tell several apart at a glance. Name what it shows specifically: the ' +
  "app, page, error or thing, and its state, like 'OpenAI pricing page, " +
  "retention table' or 'TypeScript error in register.tsx'. Reply with the " +
  'caption alone: at most 8 words, sentence case, no final period.'

/**
 * A headless Claude Code run that reads `file` (relative to the run's
 * working directory) and prints its caption. It loads Read alone, no MCP
 * servers, skills or settings hooks, and isn't kept as a session.
 */
export function captionCommand(model: CaptionModel, file: string): string[] {
  return [
    'claude',
    '-p',
    '--model',
    model,
    '--effort',
    'low',
    '--tools',
    'Read',
    '--allowedTools',
    'Read',
    '--strict-mcp-config',
    '--disable-slash-commands',
    '--no-session-persistence',
    '--settings',
    '{"disableAllHooks":true}',
    '--system-prompt',
    SYSTEM_PROMPT,
    `Caption the image in ./${file}.`,
  ]
}

const MAX_LENGTH = 80

/** The caption in a run's output: its first line, unquoted; null if none. */
export function cleanCaption(output: string): string | null {
  const line = output
    .split('\n')
    .map(text => text.trim())
    .find(Boolean)
  if (!line) return null
  const text = line
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null
  return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1)}…` : text
}

/** What to show for a caption: its text, a placeholder while it's written. */
export function captionLabel(caption: Caption | undefined): string | undefined {
  if (caption?.status === 'pending') return 'describing…'
  if (caption?.status === 'done') return caption.text
  return undefined
}

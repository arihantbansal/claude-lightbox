import { describe, expect, test } from 'claude-code/testing'

import { captionLabel, captionModelOf, cleanCaption } from '../hooks/captions'

describe('captions', () => {
  test('takes the first line, without quotes or a final period', () => {
    expect(cleanCaption('\n  "Login page with error."  \nmore\n')).toBe(
      'Login page with error',
    )
    expect(cleanCaption('`TypeScript   error in register.tsx`')).toBe(
      'TypeScript error in register.tsx',
    )
  })

  test('is null for output with no caption in it', () => {
    expect(cleanCaption('')).toBeNull()
    expect(cleanCaption('\n  \n')).toBeNull()
    expect(cleanCaption('""')).toBeNull()
  })

  test('cuts a long caption short', () => {
    const caption = cleanCaption('word '.repeat(40))
    expect(caption).toHaveLength(80)
    expect(caption?.endsWith('…')).toBe(true)
  })

  test('shows a placeholder while pending and nothing once failed', () => {
    expect(captionLabel({ status: 'pending' })).toBe('describing…')
    expect(captionLabel({ status: 'done', text: 'Login page' })).toBe(
      'Login page',
    )
    expect(captionLabel({ status: 'failed' })).toBeUndefined()
    expect(captionLabel(undefined)).toBeUndefined()
  })

  test('the setting picks a model, Sonnet unless set otherwise', () => {
    expect(captionModelOf('haiku')).toBe('haiku')
    expect(captionModelOf('sonnet')).toBe('sonnet')
    expect(captionModelOf(undefined)).toBe('sonnet')
    expect(captionModelOf('off')).toBeNull()
  })
})

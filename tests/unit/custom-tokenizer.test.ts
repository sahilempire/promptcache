import { describe, it, expect, vi } from 'vitest'
import { optimizeAnthropic } from '../../src/providers/anthropic'

function createMockClient() {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg_mock',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'ok' }],
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          cache_creation_input_tokens: 50,
          cache_read_input_tokens: 0,
        },
      }),
    },
  }
}

describe('custom tokenizer', () => {
  it('uses the provided tokenCounter instead of the built-in estimator', async () => {
    const customCounter = vi.fn().mockReturnValue(5000) // always returns 5000
    const mock = createMockClient()

    const wrapped = optimizeAnthropic(mock, {
      tokenCounter: customCounter,
      minTokens: 1024,
    })

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'Short prompt',
      messages: [{ role: 'user', content: 'Hi' }],
    })

    // the custom counter should have been called for the system prompt
    expect(customCounter).toHaveBeenCalled()

    // since our counter returns 5000 (well above minTokens 1024),
    // the system prompt should get cache_control injected
    const calledWith = mock.messages.create.mock.calls[0][0] as Record<string, unknown>
    const system = calledWith.system as Array<{ cache_control?: unknown }>
    expect(Array.isArray(system)).toBe(true)
    expect(system[system.length - 1].cache_control).toEqual({ type: 'ephemeral' })
  })

  it('falls back to built-in estimator when no tokenCounter is provided', async () => {
    const mock = createMockClient()

    // "Short prompt" with built-in estimator is ~3 tokens — below minTokens
    const wrapped = optimizeAnthropic(mock, { minTokens: 1024 })

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'Short prompt',
      messages: [{ role: 'user', content: 'Hi' }],
    })

    const calledWith = mock.messages.create.mock.calls[0][0] as Record<string, unknown>
    // system should remain a string — too short to cache without custom counter
    expect(typeof calledWith.system).toBe('string')
  })
})

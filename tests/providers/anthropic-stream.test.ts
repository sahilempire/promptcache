import { describe, it, expect, vi } from 'vitest'
import { optimizeAnthropic } from '../../src/providers/anthropic'

function createMockStreamClient() {
  const streamObj = {
    _listeners: {} as Record<string, ((...args: unknown[]) => void)[]>,
    on(event: string, cb: (...args: unknown[]) => void) {
      if (!streamObj._listeners[event]) streamObj._listeners[event] = []
      streamObj._listeners[event].push(cb)
      return streamObj
    },
    emit(event: string, ...args: unknown[]) {
      (streamObj._listeners[event] || []).forEach(cb => cb(...args))
    },
    async finalMessage() {
      return {
        id: 'msg_stream',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'streamed response' }],
        usage: {
          input_tokens: 50,
          output_tokens: 30,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 80,
        },
      }
    },
  }

  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg_mock',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      }),
      stream: vi.fn().mockReturnValue(streamObj),
    },
    _streamObj: streamObj,
  }
}

describe('anthropic streaming', () => {
  it('wraps messages.stream() and optimizes params', () => {
    const mock = createMockStreamClient()
    const wrapped = optimizeAnthropic(mock, { minTokens: 10 })

    const stream = (wrapped as any).messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'You are a helpful assistant who provides detailed answers.',
      messages: [{ role: 'user', content: 'Hello' }],
    })

    // should have called the underlying stream
    expect(mock.messages.stream).toHaveBeenCalledOnce()

    // params should have cache_control injected
    const calledWith = mock.messages.stream.mock.calls[0][0] as Record<string, unknown>
    const system = calledWith.system as Array<{ cache_control?: unknown }>
    expect(Array.isArray(system)).toBe(true)
    expect(system[system.length - 1].cache_control).toEqual({ type: 'ephemeral' })
  })

  it('tracks metrics from finalMessage()', async () => {
    const mock = createMockStreamClient()
    const wrapped = optimizeAnthropic(mock, { minTokens: 10 })

    const stream = (wrapped as any).messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Hi' }],
    })

    // call finalMessage — should track the usage
    const msg = await stream.finalMessage()

    expect(msg.usage.cache_read_input_tokens).toBe(80)

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(1)
    expect(stats.cachedInputTokens).toBe(80)
    expect(stats.cacheHits).toBe(1)
  })

  it('passes through stream without modification when disabled', () => {
    const mock = createMockStreamClient()
    const wrapped = optimizeAnthropic(mock, { enabled: false })

    const stream = (wrapped as any).messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'You are helpful.',
      messages: [{ role: 'user', content: 'Hi' }],
    })

    const calledWith = mock.messages.stream.mock.calls[0][0] as Record<string, unknown>
    // system should remain a string — not optimized
    expect(typeof calledWith.system).toBe('string')
  })

  it('still tracks stats from regular create() calls alongside stream()', async () => {
    const mock = createMockStreamClient()
    mock.messages.create.mockResolvedValueOnce({
      model: 'claude-sonnet-4-20250514',
      content: [{ type: 'text', text: 'ok' }],
      usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 50, cache_read_input_tokens: 0 },
    })

    const wrapped = optimizeAnthropic(mock)

    // regular call
    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'test',
      messages: [{ role: 'user', content: 'test' }],
    })

    // stream call
    const stream = (wrapped as any).messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'test',
      messages: [{ role: 'user', content: 'test' }],
    })
    await stream.finalMessage()

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(2)
  })
})

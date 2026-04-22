import { describe, it, expect, vi } from 'vitest'
import { optimizeOpenAI } from '../../src/providers/openai'

function createMockClient(responseOverrides: Record<string, unknown> = {}) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: 'chatcmpl-mock123',
          object: 'chat.completion',
          model: 'gpt-4o',
          choices: [{ index: 0, message: { role: 'assistant', content: 'Hello there.' }, finish_reason: 'stop' }],
          usage: {
            prompt_tokens: 150,
            completion_tokens: 30,
            total_tokens: 180,
            prompt_tokens_details: {
              cached_tokens: 0,
            },
          },
          ...responseOverrides,
        }),
      },
    },
  }
}

describe('optimizeOpenAI', () => {
  it('wraps the client and exposes stats methods', () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock)

    expect(wrapped.stats).toBeTypeOf('function')
    expect(wrapped.printStats).toBeTypeOf('function')
    expect(wrapped.resetStats).toBeTypeOf('function')
  })

  it('proxies calls through to the real client', async () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock)

    const res = await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' },
      ],
    })

    expect(mock.chat.completions.create).toHaveBeenCalledOnce()
    expect((res as any).choices[0].message.content).toBe('Hello there.')
  })

  it('reorders multiple system messages by length (longest first)', async () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock)

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Short.' },
        { role: 'system', content: 'This is a much longer system message that should come first for prefix matching.' },
        { role: 'user', content: 'Hello' },
      ],
    })

    const calledWith = mock.chat.completions.create.mock.calls[0][0] as Record<string, unknown>
    const messages = calledWith.messages as Array<{ role: string; content: string }>

    // longer system message should be first
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('much longer')
    expect(messages[1].role).toBe('system')
    expect(messages[1].content).toBe('Short.')
    // user message stays at end
    expect(messages[2].role).toBe('user')
  })

  it('does not reorder when there is only one system message', async () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock)

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Only one system msg.' },
        { role: 'user', content: 'Hello' },
      ],
    })

    const calledWith = mock.chat.completions.create.mock.calls[0][0] as Record<string, unknown>
    const messages = calledWith.messages as Array<{ role: string; content: string }>

    expect(messages[0].content).toBe('Only one system msg.')
    expect(messages[1].content).toBe('Hello')
  })

  it('tracks cached_tokens from response usage', async () => {
    const mock = createMockClient()
    mock.chat.completions.create.mockResolvedValueOnce({
      id: 'chatcmpl-1',
      model: 'gpt-4o',
      choices: [{ message: { content: 'ok' } }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
        prompt_tokens_details: { cached_tokens: 80 },
      },
    })

    const wrapped = optimizeOpenAI(mock)
    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
    })

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(1)
    expect(stats.cachedInputTokens).toBe(80)
    expect(stats.cacheHits).toBe(1)
  })

  it('counts zero cached tokens as a miss', async () => {
    const mock = createMockClient() // default has cached_tokens: 0
    const wrapped = optimizeOpenAI(mock)

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
    })

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(1)
    expect(stats.cacheHits).toBe(0)
    expect(stats.cacheMisses).toBe(1)
  })

  it('tracks multiple calls correctly', async () => {
    const mock = createMockClient()
    // first call — no cache
    mock.chat.completions.create.mockResolvedValueOnce({
      model: 'gpt-4o',
      choices: [{ message: { content: 'ok' } }],
      usage: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 0 } },
    })
    // second call — cache hit
    mock.chat.completions.create.mockResolvedValueOnce({
      model: 'gpt-4o',
      choices: [{ message: { content: 'ok' } }],
      usage: { prompt_tokens: 30, completion_tokens: 15, prompt_tokens_details: { cached_tokens: 70 } },
    })

    const wrapped = optimizeOpenAI(mock)

    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: 'a' }] })
    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: 'b' }] })

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(2)
    expect(stats.cacheHits).toBe(1)
    expect(stats.cacheMisses).toBe(1)
    expect(stats.cachedInputTokens).toBe(70)
  })

  it('resetStats clears everything', async () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock)

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(wrapped.stats().totalRequests).toBe(1)
    wrapped.resetStats()

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(0)
    expect(stats.cacheHits).toBe(0)
  })

  it('printStats runs without throwing', async () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock)

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
    })

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(() => wrapped.printStats()).not.toThrow()
    spy.mockRestore()
  })

  it('passes through other properties untouched', () => {
    const mock = createMockClient() as any
    mock.models = { list: () => 'models' }

    const wrapped = optimizeOpenAI(mock) as any
    expect(wrapped.models.list()).toBe('models')
  })

  it('skips optimization when disabled', async () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock, { enabled: false })

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Short.' },
        { role: 'system', content: 'This is a longer message that would normally get reordered.' },
        { role: 'user', content: 'Hello' },
      ],
    })

    const calledWith = mock.chat.completions.create.mock.calls[0][0] as Record<string, unknown>
    const messages = calledWith.messages as Array<{ role: string; content: string }>

    // should NOT be reordered — original order preserved
    expect(messages[0].content).toBe('Short.')
  })

  it('disables reordering when reorderSystemMessages is false', async () => {
    const mock = createMockClient()
    const wrapped = optimizeOpenAI(mock, { reorderSystemMessages: false })

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'A' },
        { role: 'system', content: 'BB' },
        { role: 'user', content: 'Hello' },
      ],
    })

    const calledWith = mock.chat.completions.create.mock.calls[0][0] as Record<string, unknown>
    const messages = calledWith.messages as Array<{ role: string; content: string }>

    // original order kept
    expect(messages[0].content).toBe('A')
    expect(messages[1].content).toBe('BB')
  })
})

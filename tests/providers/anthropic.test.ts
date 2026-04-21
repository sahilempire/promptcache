import { describe, it, expect, vi, beforeEach } from 'vitest'
import { optimizeAnthropic } from '../../src/providers/anthropic'

function createMockClient(responseOverrides: Record<string, unknown> = {}) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg_mock123',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Here is your answer.' }],
        usage: {
          input_tokens: 150,
          output_tokens: 42,
          cache_creation_input_tokens: 80,
          cache_read_input_tokens: 0,
        },
        ...responseOverrides,
      }),
    },
  }
}

describe('optimizeAnthropic', () => {
  it('wraps the client and exposes stats methods', () => {
    const mock = createMockClient()
    const wrapped = optimizeAnthropic(mock)

    expect(wrapped.stats).toBeTypeOf('function')
    expect(wrapped.printStats).toBeTypeOf('function')
    expect(wrapped.resetStats).toBeTypeOf('function')
  })

  it('still lets you call messages.create normally', async () => {
    const mock = createMockClient()
    const wrapped = optimizeAnthropic(mock)

    const response = await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'You are a helpful assistant that answers questions about geography.',
      messages: [{ role: 'user', content: 'What is the capital of France?' }],
    })

    expect(mock.messages.create).toHaveBeenCalledOnce()
    expect((response as any).content[0].text).toBe('Here is your answer.')
  })

  it('injects cache_control into system prompt', async () => {
    const mock = createMockClient()
    // lower minTokens so we don't need huge prompts in tests
    const wrapped = optimizeAnthropic(mock, { minTokens: 10 })

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'You are an expert chef. You know every recipe from every country and can explain techniques clearly. You provide measurements in both metric and imperial units.',
      messages: [{ role: 'user', content: 'How do I poach an egg?' }],
    })

    const calledWith = mock.messages.create.mock.calls[0][0] as Record<string, unknown>
    const system = calledWith.system as Array<{ type: string; cache_control?: unknown }>

    // should be converted to a content block array with cache_control on it
    expect(Array.isArray(system)).toBe(true)
    expect(system[system.length - 1].cache_control).toEqual({ type: 'ephemeral' })
  })

  it('injects cache_control into tools array', async () => {
    const mock = createMockClient()
    const wrapped = optimizeAnthropic(mock, { minTokens: 10 })

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'You help users check the weather and plan trips.',
      tools: [
        { name: 'get_weather', description: 'Get weather for a city', input_schema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] } },
        { name: 'get_forecast', description: 'Get 5-day forecast', input_schema: { type: 'object', properties: { city: { type: 'string' }, days: { type: 'number' } }, required: ['city'] } },
      ],
      messages: [{ role: 'user', content: 'Will it rain tomorrow in London?' }],
    })

    const calledWith = mock.messages.create.mock.calls[0][0] as Record<string, unknown>
    const tools = calledWith.tools as Array<Record<string, unknown>>

    // last tool should have cache_control attached
    expect(tools[tools.length - 1].cache_control).toEqual({ type: 'ephemeral' })
    // first tool should NOT have cache_control
    expect(tools[0].cache_control).toBeUndefined()
  })

  it('tracks cache creation tokens from response usage', async () => {
    const mock = createMockClient()
    const wrapped = optimizeAnthropic(mock)

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Hello' }],
    })

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(1)
    expect(stats.cacheCreationTokens).toBe(80)
    expect(stats.cachedInputTokens).toBe(0)
  })

  it('tracks cache read tokens on subsequent calls', async () => {
    const mock = createMockClient()
    // first call creates cache
    mock.messages.create.mockResolvedValueOnce({
      id: 'msg_1',
      model: 'claude-sonnet-4-20250514',
      content: [{ type: 'text', text: 'ok' }],
      usage: {
        input_tokens: 100,
        output_tokens: 20,
        cache_creation_input_tokens: 80,
        cache_read_input_tokens: 0,
      },
    })
    // second call reads from cache
    mock.messages.create.mockResolvedValueOnce({
      id: 'msg_2',
      model: 'claude-sonnet-4-20250514',
      content: [{ type: 'text', text: 'ok again' }],
      usage: {
        input_tokens: 30,
        output_tokens: 15,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 80,
      },
    })

    const wrapped = optimizeAnthropic(mock)

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'Be helpful.',
      messages: [{ role: 'user', content: 'Hi' }],
    })
    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'Be helpful.',
      messages: [{ role: 'user', content: 'Hi again' }],
    })

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(2)
    expect(stats.cacheHits).toBe(1)
    expect(stats.cacheMisses).toBe(1)
    expect(stats.cachedInputTokens).toBe(80)
    expect(stats.cacheCreationTokens).toBe(80)
  })

  it('resetStats clears everything', async () => {
    const mock = createMockClient()
    const wrapped = optimizeAnthropic(mock)

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'test',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(wrapped.stats().totalRequests).toBe(1)

    wrapped.resetStats()

    const stats = wrapped.stats()
    expect(stats.totalRequests).toBe(0)
    expect(stats.cacheHits).toBe(0)
    expect(stats.cachedInputTokens).toBe(0)
  })

  it('printStats runs without throwing', async () => {
    const mock = createMockClient()
    const wrapped = optimizeAnthropic(mock)

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'test prompt',
      messages: [{ role: 'user', content: 'hey' }],
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(() => wrapped.printStats()).not.toThrow()
    consoleSpy.mockRestore()
  })

  it('passes through non-messages properties untouched', () => {
    const mock = createMockClient() as any
    mock.someOtherMethod = () => 'hello'

    const wrapped = optimizeAnthropic(mock) as any
    expect(wrapped.someOtherMethod()).toBe('hello')
  })

  it('skips optimization when disabled', async () => {
    const mock = createMockClient()
    const wrapped = optimizeAnthropic(mock, { enabled: false })

    await wrapped.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: 'You are a helpful assistant that provides cooking advice.',
      messages: [{ role: 'user', content: 'test' }],
    })

    const calledWith = mock.messages.create.mock.calls[0][0] as Record<string, unknown>
    // system should remain a plain string, not converted to blocks
    expect(typeof calledWith.system).toBe('string')
  })
})

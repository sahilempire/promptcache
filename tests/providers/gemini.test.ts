import { describe, it, expect, vi, beforeEach } from 'vitest'
import { optimizeGemini } from '../../src/providers/gemini'

function createMockGenAI() {
  const mockModel = {
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: () => 'Generated response',
        usageMetadata: {
          promptTokenCount: 200,
          candidatesTokenCount: 50,
          cachedContentTokenCount: 180,
        },
      },
    }),
    generateContentStream: vi.fn().mockResolvedValue({
      stream: (async function* () {
        yield { text: () => 'chunk' }
      })(),
      response: Promise.resolve({
        text: () => 'full response',
        usageMetadata: {
          promptTokenCount: 200,
          candidatesTokenCount: 50,
          cachedContentTokenCount: 180,
        },
      }),
    }),
  }

  return {
    genAI: {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      getGenerativeModelFromCachedContent: vi.fn().mockReturnValue(mockModel),
    },
    mockModel,
  }
}

function createMockCacheManager() {
  let counter = 0
  return {
    create: vi.fn().mockImplementation(async () => ({
      name: `cachedContents/test-cache-${++counter}`,
      model: 'gemini-2.5-flash',
      displayName: 'test cache',
    })),
    get: vi.fn().mockImplementation(async (name: string) => ({
      name,
      model: 'gemini-2.5-flash',
    })),
    delete: vi.fn().mockResolvedValue(undefined),
  }
}

describe('optimizeGemini', () => {
  it('returns a model proxy with stats methods', () => {
    const { genAI } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'Be helpful.',
    })

    expect(result.model).toBeDefined()
    expect(result.stats).toBeTypeOf('function')
    expect(result.printStats).toBeTypeOf('function')
    expect(result.resetStats).toBeTypeOf('function')
  })

  it('uses regular model when content is below 32K tokens', async () => {
    const { genAI, mockModel } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'Short prompt.',
      minTokens: 32768, // default gemini minimum
    })

    await result.model.generateContent('Hello')

    // should NOT create a cache — too few tokens
    expect(cacheManager.create).not.toHaveBeenCalled()
    // should use regular model
    expect(genAI.getGenerativeModel).toHaveBeenCalled()
    expect(mockModel.generateContent).toHaveBeenCalledWith('Hello')
  })

  it('creates cached content when above minimum tokens', async () => {
    const { genAI, mockModel } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    // use a very low minTokens to trigger caching in test
    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'A system prompt that would be large enough.',
      minTokens: 5, // artificially low for testing
    })

    await result.model.generateContent('Hello')

    expect(cacheManager.create).toHaveBeenCalledOnce()
    expect(mockModel.generateContent).toHaveBeenCalledWith('Hello')
  })

  it('reuses cached content on second call', async () => {
    const { genAI, mockModel } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'A system prompt for testing.',
      minTokens: 5,
    })

    await result.model.generateContent('First call')
    await result.model.generateContent('Second call')

    // cache should be created once, reused on second call
    expect(cacheManager.create).toHaveBeenCalledOnce()
    expect(cacheManager.get).toHaveBeenCalledOnce() // second call fetches by name
    expect(mockModel.generateContent).toHaveBeenCalledTimes(2)
  })

  it('tracks usage metrics', async () => {
    const { genAI } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'Test prompt.',
      minTokens: 5,
    })

    await result.model.generateContent('Hello')

    const stats = result.stats()
    expect(stats.totalRequests).toBe(1)
    expect(stats.cachedInputTokens).toBe(180)
    expect(stats.cacheHits).toBe(1)
  })

  it('resetStats clears everything', async () => {
    const { genAI } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'Test.',
      minTokens: 5,
    })

    await result.model.generateContent('Hello')
    expect(result.stats().totalRequests).toBe(1)

    result.resetStats()
    expect(result.stats().totalRequests).toBe(0)
  })

  it('printStats runs without throwing', async () => {
    const { genAI } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'Test.',
      minTokens: 5,
    })

    await result.model.generateContent('Hello')

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(() => result.printStats()).not.toThrow()
    spy.mockRestore()
  })

  it('falls back to regular model when cache creation fails', async () => {
    const { genAI, mockModel } = createMockGenAI()
    const cacheManager = createMockCacheManager()
    cacheManager.create.mockRejectedValueOnce(new Error('quota exceeded'))

    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'Test prompt.',
      minTokens: 5,
    })

    // should not throw — falls back gracefully
    await result.model.generateContent('Hello')
    expect(mockModel.generateContent).toHaveBeenCalled()

    spy.mockRestore()
  })

  it('clearCache runs without throwing', async () => {
    const { genAI } = createMockGenAI()
    const cacheManager = createMockCacheManager()

    const result = optimizeGemini(genAI as any, cacheManager, {
      model: 'gemini-2.5-flash',
      systemInstruction: 'Test.',
      minTokens: 5,
    })

    await result.model.generateContent('Hello')
    await expect(result.clearCache()).resolves.not.toThrow()
  })
})

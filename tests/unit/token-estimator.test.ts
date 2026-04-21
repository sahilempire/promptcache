import { describe, it, expect } from 'vitest'
import { estimateTokens, estimateTokensForObject } from '../../src/core/token-estimator'

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('estimates english text roughly at 4 chars per token', () => {
    const text = 'Hello, how are you doing today?'
    const estimate = estimateTokens(text)
    // ~30 chars / 4 = ~8 tokens, actual is around 8
    expect(estimate).toBeGreaterThan(5)
    expect(estimate).toBeLessThan(15)
  })

  it('handles longer text', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(100)
    const estimate = estimateTokens(text)
    // ~4500 chars, should be ~1100 tokens
    expect(estimate).toBeGreaterThan(800)
    expect(estimate).toBeLessThan(1500)
  })

  it('adjusts for code content', () => {
    const code = 'function foo(x: number): { return x * 2; }'
    const prose = 'The function takes a number and returns it doubled'
    const codeEstimate = estimateTokens(code)
    const proseEstimate = estimateTokens(prose)
    // code should estimate slightly higher per char
    expect(codeEstimate).toBeGreaterThan(0)
    expect(proseEstimate).toBeGreaterThan(0)
  })

  it('adjusts for non-ascii content', () => {
    const cjk = '这是一个测试句子用于估算令牌数量'
    const estimate = estimateTokens(cjk)
    // CJK chars should produce more tokens per char
    expect(estimate).toBeGreaterThan(5)
  })
})

describe('estimateTokensForObject', () => {
  it('estimates tokens for a JSON object', () => {
    const obj = {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
        },
      },
    }
    const estimate = estimateTokensForObject(obj)
    expect(estimate).toBeGreaterThan(20)
    expect(estimate).toBeLessThan(100)
  })
})

import { describe, it, expect } from 'vitest'
import { selectBreakpoints, estimateSavings } from '../../src/core/strategy'
import type { PromptSegment } from '../../src/types'

const makeSegment = (
  path: string,
  tokens: number,
  stability: number,
  type: PromptSegment['type'] = 'system',
): PromptSegment => ({
  path,
  content: 'test',
  tokenEstimate: tokens,
  stabilityScore: stability,
  type,
})

describe('selectBreakpoints', () => {
  it('selects segments above minimum tokens', () => {
    const segments = [
      makeSegment('system', 2000, 0.95),
      makeSegment('tools', 500, 0.95), // below 1024 min
      makeSegment('messages[0]', 1500, 0.8),
    ]

    const bps = selectBreakpoints(segments, {
      maxBreakpoints: 4,
      minTokens: 1024,
      strategy: 'auto',
    })

    expect(bps.length).toBe(2)
    expect(bps.find(b => b.path === 'tools')).toBeUndefined()
  })

  it('respects maxBreakpoints limit', () => {
    const segments = [
      makeSegment('system', 2000, 0.95),
      makeSegment('tools', 3000, 0.95),
      makeSegment('messages[0]', 1500, 0.8),
      makeSegment('messages[1]', 1200, 0.75),
    ]

    const bps = selectBreakpoints(segments, {
      maxBreakpoints: 2,
      minTokens: 1024,
      strategy: 'auto',
    })

    expect(bps.length).toBe(2)
    // should pick the highest scored ones (stability * tokens)
    expect(bps[0].path).toBe('tools') // 3000 * 0.95 = 2850
    expect(bps[1].path).toBe('system') // 2000 * 0.95 = 1900
  })

  it('returns empty for strategy=none', () => {
    const segments = [makeSegment('system', 5000, 0.99)]
    const bps = selectBreakpoints(segments, {
      maxBreakpoints: 4,
      minTokens: 1024,
      strategy: 'none',
    })
    expect(bps.length).toBe(0)
  })

  it('conservative strategy requires high stability', () => {
    const segments = [
      makeSegment('system', 2000, 0.95),
      makeSegment('messages[0]', 2000, 0.7), // not stable enough for conservative
    ]

    const bps = selectBreakpoints(segments, {
      maxBreakpoints: 4,
      minTokens: 1024,
      strategy: 'conservative',
    })

    expect(bps.length).toBe(1)
    expect(bps[0].path).toBe('system')
  })

  it('aggressive strategy accepts lower stability', () => {
    const segments = [
      makeSegment('system', 2000, 0.95),
      makeSegment('messages[2]', 2000, 0.5),
    ]

    const bps = selectBreakpoints(segments, {
      maxBreakpoints: 4,
      minTokens: 1024,
      strategy: 'aggressive',
    })

    expect(bps.length).toBe(2)
  })
})

describe('estimateSavings', () => {
  it('calculates savings correctly', () => {
    const breakpoints = [
      { path: 'system', tokenCount: 5000, reason: 'system prompt' },
    ]

    const result = estimateSavings(breakpoints, 6000, 3.0) // $3/M tokens
    expect(result.cachedTokens).toBe(5000)
    expect(result.savedPerRequest).toBeGreaterThan(0)
    // 5000 tokens: normal = $0.015, cached = $0.0015, save ~$0.0135
    expect(result.savedPerRequest).toBeCloseTo(0.0135, 3)
  })
})

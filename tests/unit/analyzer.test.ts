import { describe, it, expect } from 'vitest'
import { PromptAnalyzer } from '../../src/core/analyzer'

describe('PromptAnalyzer', () => {
  it('identifies system prompt as stable', () => {
    const analyzer = new PromptAnalyzer()
    const analysis = analyzer.analyzeAnthropicParams({
      system: 'You are a helpful assistant who specializes in cooking recipes from around the world.',
      messages: [{ role: 'user', content: 'What is biryani?' }],
    })

    const systemSeg = analysis.segments.find(s => s.path === 'system')
    expect(systemSeg).toBeDefined()
    expect(systemSeg!.stabilityScore).toBeGreaterThanOrEqual(0.9)
  })

  it('identifies user message as variable', () => {
    const analyzer = new PromptAnalyzer()
    const analysis = analyzer.analyzeAnthropicParams({
      system: 'You are helpful.',
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    })

    const userSeg = analysis.segments.find(s => s.path === 'messages[0]')
    expect(userSeg).toBeDefined()
    // single message is the last turn, should be low stability
    expect(userSeg!.stabilityScore).toBeLessThanOrEqual(0.3)
  })

  it('scores tool definitions as highly stable', () => {
    const analyzer = new PromptAnalyzer()
    const analysis = analyzer.analyzeAnthropicParams({
      system: 'You are helpful.',
      tools: [
        { name: 'get_weather', description: 'Get weather data', input_schema: { type: 'object', properties: { city: { type: 'string' } } } },
        { name: 'search', description: 'Search the web', input_schema: { type: 'object', properties: { query: { type: 'string' } } } },
      ],
      messages: [{ role: 'user', content: 'What is the weather?' }],
    })

    const toolsSeg = analysis.segments.find(s => s.path === 'tools')
    expect(toolsSeg).toBeDefined()
    expect(toolsSeg!.stabilityScore).toBeGreaterThanOrEqual(0.9)
  })

  it('increases stability score for repeated content', () => {
    const analyzer = new PromptAnalyzer()
    const systemPrompt = 'You are a cooking expert. Help users with recipes.'

    // first call
    analyzer.analyzeAnthropicParams({
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Recipe for pasta' }],
    })

    // second call — same system prompt
    const analysis = analyzer.analyzeAnthropicParams({
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Recipe for biryani' }],
    })

    const systemSeg = analysis.segments.find(s => s.path === 'system')
    expect(systemSeg!.stabilityScore).toBeGreaterThanOrEqual(0.9)
  })

  it('older messages get higher stability than recent ones', () => {
    const analyzer = new PromptAnalyzer()
    const analysis = analyzer.analyzeAnthropicParams({
      system: 'You are helpful.',
      messages: [
        { role: 'user', content: 'First message in conversation' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second question here' },
        { role: 'assistant', content: 'Second response' },
        { role: 'user', content: 'Third question' },
        { role: 'assistant', content: 'Third response' },
        { role: 'user', content: 'Latest question (this changes)' },
      ],
    })

    const first = analysis.segments.find(s => s.path === 'messages[0]')
    const last = analysis.segments.find(s => s.path === 'messages[6]')

    expect(first!.stabilityScore).toBeGreaterThan(last!.stabilityScore)
  })

  it('returns correct cacheable tokens summary', () => {
    const analyzer = new PromptAnalyzer()
    const analysis = analyzer.analyzeAnthropicParams({
      system: 'A'.repeat(4000), // ~1000 tokens, well above threshold
      messages: [{ role: 'user', content: 'Short question' }],
    })

    expect(analysis.totalTokens).toBeGreaterThan(0)
    expect(analysis.cacheableTokens).toBeGreaterThan(0)
    expect(analysis.stableSegments.length).toBeGreaterThan(0)
    expect(analysis.estimatedSavingsPercent).toBeGreaterThan(0)
  })

  it('handles block-style system prompts', () => {
    const analyzer = new PromptAnalyzer()
    const analysis = analyzer.analyzeAnthropicParams({
      system: [
        { type: 'text', text: 'You are a helpful assistant.' },
        { type: 'text', text: 'Always be concise and accurate.' },
      ],
      messages: [{ role: 'user', content: 'Hi' }],
    })

    const systemBlocks = analysis.segments.filter(s => s.path.startsWith('system'))
    expect(systemBlocks.length).toBe(2)
    expect(systemBlocks[0].stabilityScore).toBeGreaterThanOrEqual(0.9)
  })
})

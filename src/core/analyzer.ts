import type { PromptSegment, PromptAnalysis, Strategy } from '../types.js'
import { estimateTokens, estimateTokensForObject } from './token-estimator.js'
import { ContentDiffer } from './differ.js'

/**
 * The heart of promptcache. Analyzes a prompt to identify which parts
 * are worth caching and where to place breakpoints.
 *
 * Scoring is based on:
 * - Position: system prompts and tools are almost always static
 * - Size: bigger blocks save more money when cached
 * - Repetition: if we've seen it before, it's definitely stable
 * - Content patterns: XML tags, JSON schemas, large text = likely static
 */
export class PromptAnalyzer {
  private differ: ContentDiffer
  private tokenCounter: (text: string) => number

  constructor(
    differ?: ContentDiffer,
    tokenCounter?: (text: string) => number,
  ) {
    this.differ = differ || new ContentDiffer()
    this.tokenCounter = tokenCounter || estimateTokens
  }

  analyzeAnthropicParams(params: {
    system?: string | Array<{ type: string; text?: string; [key: string]: unknown }>
    messages?: Array<{ role: string; content: string | Array<{ type: string; text?: string; [key: string]: unknown }> }>
    tools?: Array<Record<string, unknown>>
  }): PromptAnalysis {
    const segments: PromptSegment[] = []

    // analyze system prompt
    if (params.system) {
      if (typeof params.system === 'string') {
        const tokens = this.tokenCounter(params.system)
        const repetitions = this.differ.recordAndCount(params.system)
        segments.push({
          path: 'system',
          content: params.system.slice(0, 200),
          tokenEstimate: tokens,
          stabilityScore: this.scoreStability('system', repetitions, params.system),
          type: 'system',
        })
      } else if (Array.isArray(params.system)) {
        params.system.forEach((block, i) => {
          if (block.type === 'text' && block.text) {
            const tokens = this.tokenCounter(block.text)
            const repetitions = this.differ.recordAndCount(block.text)
            segments.push({
              path: `system[${i}]`,
              content: block.text.slice(0, 200),
              tokenEstimate: tokens,
              stabilityScore: this.scoreStability('system', repetitions, block.text),
              type: 'system',
            })
          }
        })
      }
    }

    // analyze tools
    if (params.tools && params.tools.length > 0) {
      const toolsJson = JSON.stringify(params.tools)
      const tokens = estimateTokensForObject(params.tools)
      const repetitions = this.differ.recordObjectAndCount(params.tools)
      segments.push({
        path: 'tools',
        content: `${params.tools.length} tool definitions`,
        tokenEstimate: tokens,
        stabilityScore: this.scoreStability('tool', repetitions),
        type: 'tool',
      })
    }

    // analyze messages
    if (params.messages) {
      const totalMessages = params.messages.length
      params.messages.forEach((msg, i) => {
        const text = typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content)
        const tokens = this.tokenCounter(text)

        // messages near the end of the conversation are likely the variable part
        const positionFromEnd = totalMessages - i
        const repetitions = this.differ.recordAndCount(text)

        let baseScore: number
        if (positionFromEnd <= 1) {
          baseScore = 0.1 // current turn — always changing
        } else if (positionFromEnd <= 3) {
          baseScore = 0.3 // recent turns — probably changing
        } else {
          baseScore = 0.7 // older turns — likely stable in a session
        }

        segments.push({
          path: `messages[${i}]`,
          content: text.slice(0, 200),
          tokenEstimate: tokens,
          stabilityScore: this.scoreStability('message', repetitions, text, baseScore),
          type: 'message',
        })
      })
    }

    // build the analysis
    const stableSegments = segments.filter(s => s.stabilityScore >= 0.6)
    const variableSegments = segments.filter(s => s.stabilityScore < 0.6)
    const totalTokens = segments.reduce((sum, s) => sum + s.tokenEstimate, 0)
    const cacheableTokens = stableSegments.reduce((sum, s) => sum + s.tokenEstimate, 0)

    return {
      segments,
      stableSegments,
      variableSegments,
      totalTokens,
      cacheableTokens,
      estimatedSavingsPercent: totalTokens > 0
        ? Math.round((cacheableTokens / totalTokens) * 90) // 90% is the cache read discount
        : 0,
    }
  }

  private scoreStability(
    type: string,
    repetitions: number,
    content?: string,
    baseScore?: number,
  ): number {
    let score = baseScore ?? 0.5

    // structural position matters a lot
    if (type === 'system') score = Math.max(score, 0.9)
    if (type === 'tool') score = Math.max(score, 0.9)

    // seen before? that's a strong signal
    if (repetitions >= 3) score = Math.max(score, 0.95)
    else if (repetitions >= 2) score = Math.max(score, 0.85)

    // content heuristics
    if (content) {
      // XML-style tags usually indicate structured static instructions
      if (content.includes('<instructions>') || content.includes('<context>') || content.includes('<rules>')) {
        score = Math.max(score, 0.85)
      }
      // large text blocks are usually documents/knowledge bases
      if (content.length > 5000) {
        score = Math.max(score, 0.8)
      }
      // JSON schemas
      if (content.includes('"type"') && content.includes('"properties"')) {
        score = Math.max(score, 0.85)
      }
    }

    return Math.min(score, 1)
  }
}

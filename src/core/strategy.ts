import type { PromptSegment, BreakpointSuggestion, Strategy } from '../types.js'

/**
 * Given analyzed segments, decide where to place cache breakpoints.
 *
 * For Anthropic, we get up to 4 breakpoints. We want to place them
 * to maximize the total cached tokens while respecting the minimum
 * token threshold.
 *
 * The algorithm is greedy: sort by (stability * tokens) descending,
 * pick the top N that meet the minimum.
 */
export function selectBreakpoints(
  segments: PromptSegment[],
  opts: {
    maxBreakpoints: number
    minTokens: number
    strategy: Strategy
  },
): BreakpointSuggestion[] {
  if (opts.strategy === 'none') return []

  const eligible = segments.filter(s => {
    if (s.tokenEstimate < opts.minTokens) return false

    switch (opts.strategy) {
      case 'aggressive':
        return s.stabilityScore >= 0.4
      case 'conservative':
        return s.stabilityScore >= 0.85
      case 'auto':
      default:
        return s.stabilityScore >= 0.6
    }
  })

  // score each segment: stability * token count
  // bigger stable blocks = more savings
  const scored = eligible
    .map(s => ({
      segment: s,
      score: s.stabilityScore * s.tokenEstimate,
    }))
    .sort((a, b) => b.score - a.score)

  const selected = scored.slice(0, opts.maxBreakpoints)

  return selected.map(({ segment }) => ({
    path: segment.path,
    tokenCount: segment.tokenEstimate,
    reason: buildReason(segment),
  }))
}

function buildReason(segment: PromptSegment): string {
  const parts: string[] = []

  if (segment.type === 'system') parts.push('system prompt')
  else if (segment.type === 'tool') parts.push('tool definitions')
  else if (segment.type === 'document') parts.push('document content')
  else parts.push(`${segment.type} content`)

  parts.push(`(~${segment.tokenEstimate} tokens)`)

  if (segment.stabilityScore >= 0.9) parts.push('— highly stable')
  else if (segment.stabilityScore >= 0.7) parts.push('— stable')

  return parts.join(' ')
}

/**
 * Estimate how much money you'd save with these breakpoints.
 */
export function estimateSavings(
  breakpoints: BreakpointSuggestion[],
  totalInputTokens: number,
  pricePerMillionInput: number,
): { savedPerRequest: number; cachedTokens: number } {
  const cachedTokens = breakpoints.reduce((sum, bp) => sum + bp.tokenCount, 0)

  // cached tokens cost 10% of normal (90% savings)
  const normalCost = (cachedTokens / 1_000_000) * pricePerMillionInput
  const cachedCost = (cachedTokens / 1_000_000) * pricePerMillionInput * 0.1
  const savedPerRequest = normalCost - cachedCost

  return { savedPerRequest, cachedTokens }
}

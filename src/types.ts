export type Provider = 'anthropic' | 'openai' | 'gemini'

export type Strategy = 'auto' | 'aggressive' | 'conservative' | 'none'

export interface CacheOptions {
  enabled?: boolean
  minTokens?: number
  strategy?: Strategy
  trackStats?: boolean
  debug?: boolean
  onOptimize?: (event: OptimizeEvent) => void
  tokenCounter?: (text: string) => number
}

export interface AnthropicCacheOptions extends CacheOptions {
  maxBreakpoints?: 1 | 2 | 3 | 4
  ttl?: '5m' | '1h'
}

export interface OpenAICacheOptions extends CacheOptions {
  reorderSystemMessages?: boolean
}

export interface GeminiCacheOptions extends CacheOptions {
  cacheTtlSeconds?: number
  maxCacheEntries?: number
}

export interface PromptSegment {
  path: string
  content: string
  tokenEstimate: number
  stabilityScore: number
  type: 'system' | 'message' | 'tool' | 'document' | 'image'
}

export interface PromptAnalysis {
  segments: PromptSegment[]
  stableSegments: PromptSegment[]
  variableSegments: PromptSegment[]
  totalTokens: number
  cacheableTokens: number
  estimatedSavingsPercent: number
}

export interface BreakpointSuggestion {
  path: string
  tokenCount: number
  reason: string
}

export interface OptimizeEvent {
  provider: Provider
  breakpointsPlaced: number
  estimatedCacheableTokens: number
  segmentsAnalyzed: number
  durationMs: number
}

export interface RequestStat {
  timestamp: number
  provider: Provider
  model: string
  inputTokens: number
  cachedTokens: number
  cacheCreationTokens: number
  outputTokens: number
  estimatedCostUsd: number
  estimatedSavingsUsd: number
}

export interface ModelStats {
  requests: number
  totalInputTokens: number
  cachedInputTokens: number
  estimatedSavingsUsd: number
}

export interface CacheStats {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  totalInputTokens: number
  cachedInputTokens: number
  cacheCreationTokens: number
  estimatedSavingsUsd: number
  estimatedSavingsPercent: number
  byModel: Record<string, ModelStats>
  history: RequestStat[]
}

export interface StatsAccessor {
  stats(): CacheStats
  printStats(): void
  resetStats(): void
}

export interface CacheMetrics {
  cacheCreationTokens: number
  cacheReadTokens: number
  totalInputTokens: number
  outputTokens: number
  model: string
  provider: Provider
}

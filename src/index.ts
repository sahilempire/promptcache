export { optimizeAnthropic } from './providers/anthropic.js'
export { optimizeOpenAI } from './providers/openai.js'
export { optimizeGemini } from './providers/gemini.js'
export { PromptAnalyzer } from './core/analyzer.js'
export { selectBreakpoints, estimateSavings } from './core/strategy.js'
export { estimateTokens } from './core/token-estimator.js'
export { StatsTracker } from './stats/tracker.js'

export type {
  CacheOptions,
  AnthropicCacheOptions,
  OpenAICacheOptions,
  GeminiCacheOptions,
  CacheStats,
  RequestStat,
  ModelStats,
  OptimizeEvent,
  PromptAnalysis,
  PromptSegment,
  BreakpointSuggestion,
  StatsAccessor,
  Provider,
  Strategy,
} from './types.js'

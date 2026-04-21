import type { AnthropicCacheOptions, OptimizeEvent, CacheMetrics } from '../types.js'
import { PromptAnalyzer } from '../core/analyzer.js'
import { selectBreakpoints } from '../core/strategy.js'
import { StatsTracker } from '../stats/tracker.js'
import { createLogger } from '../utils/logger.js'
import { ContentDiffer } from '../core/differ.js'

type AnyAnthropic = {
  messages: {
    create: (params: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  [key: string]: unknown
}

interface ContentBlock {
  type: string
  text?: string
  cache_control?: { type: string }
  [key: string]: unknown
}

const DEFAULT_OPTIONS: Required<AnthropicCacheOptions> = {
  enabled: true,
  minTokens: 1024,
  strategy: 'auto',
  maxBreakpoints: 4,
  ttl: '5m',
  trackStats: true,
  debug: false,
  onOptimize: () => {},
  tokenCounter: undefined as unknown as (text: string) => number,
}

export function optimizeAnthropic<T extends AnyAnthropic>(
  client: T,
  userOptions?: AnthropicCacheOptions,
): T & { stats(): import('../types.js').CacheStats; printStats(): void; resetStats(): void } {
  const opts = { ...DEFAULT_OPTIONS, ...userOptions }
  const log = createLogger(opts.debug)
  const differ = new ContentDiffer()
  const analyzer = new PromptAnalyzer(differ, opts.tokenCounter || undefined)
  const tracker = new StatsTracker()

  log.debug('initialized with options:', {
    strategy: opts.strategy,
    maxBreakpoints: opts.maxBreakpoints,
    minTokens: opts.minTokens,
  })

  return new Proxy(client, {
    get(target, prop) {
      // expose stats methods
      if (prop === 'stats') return () => tracker.getStats()
      if (prop === 'printStats') return () => tracker.print()
      if (prop === 'resetStats') return () => tracker.reset()

      if (prop === 'messages') {
        return new Proxy(target.messages, {
          get(messagesTarget, messagesProp) {
            if (messagesProp === 'create') {
              return async (params: Record<string, unknown>) => {
                if (!opts.enabled) {
                  return messagesTarget.create.call(messagesTarget, params)
                }

                const start = performance.now()
                const optimized = optimizeParams(params, analyzer, opts, log)
                const durationMs = performance.now() - start

                opts.onOptimize?.({
                  provider: 'anthropic',
                  breakpointsPlaced: countBreakpoints(optimized),
                  estimatedCacheableTokens: 0,
                  segmentsAnalyzed: 0,
                  durationMs,
                })

                const response = await messagesTarget.create.call(
                  messagesTarget,
                  optimized,
                ) as Record<string, unknown>

                if (opts.trackStats) {
                  const metrics = extractMetrics(response)
                  tracker.record(metrics)
                }

                return response
              }
            }
            return Reflect.get(messagesTarget, messagesProp)
          },
        })
      }

      return Reflect.get(target, prop)
    },
  }) as T & { stats(): import('../types.js').CacheStats; printStats(): void; resetStats(): void }
}

function optimizeParams(
  params: Record<string, unknown>,
  analyzer: PromptAnalyzer,
  opts: Required<AnthropicCacheOptions>,
  log: ReturnType<typeof createLogger>,
): Record<string, unknown> {
  const optimized = { ...params }

  const analysis = analyzer.analyzeAnthropicParams(params as Parameters<PromptAnalyzer['analyzeAnthropicParams']>[0])

  const breakpoints = selectBreakpoints(analysis.segments, {
    maxBreakpoints: opts.maxBreakpoints,
    minTokens: opts.minTokens,
    strategy: opts.strategy,
  })

  if (breakpoints.length === 0) {
    log.debug('no segments eligible for caching')
    return optimized
  }

  log.debug(`placing ${breakpoints.length} breakpoints:`, breakpoints.map(b => b.path))

  // inject cache_control into system prompt
  const systemBreakpoint = breakpoints.find(b => b.path.startsWith('system'))
  if (systemBreakpoint && optimized.system) {
    optimized.system = injectSystemCache(optimized.system as string | ContentBlock[], opts.ttl)
  }

  // inject cache_control into tools
  const toolsBreakpoint = breakpoints.find(b => b.path === 'tools')
  if (toolsBreakpoint && optimized.tools) {
    const tools = optimized.tools as Array<Record<string, unknown>>
    if (tools.length > 0) {
      const last = { ...tools[tools.length - 1] }
      last.cache_control = { type: 'ephemeral' }
      optimized.tools = [...tools.slice(0, -1), last]
    }
  }

  // inject cache_control into messages (for older turns)
  const messageBreakpoints = breakpoints.filter(b => b.path.startsWith('messages'))
  if (messageBreakpoints.length > 0 && optimized.messages) {
    const messages = [...(optimized.messages as Array<Record<string, unknown>>)]
    for (const bp of messageBreakpoints) {
      const match = bp.path.match(/messages\[(\d+)\]/)
      if (!match) continue
      const idx = parseInt(match[1])
      if (idx < messages.length) {
        messages[idx] = injectMessageCache(messages[idx])
      }
    }
    optimized.messages = messages
  }

  return optimized
}

function injectSystemCache(
  system: string | ContentBlock[],
  ttl: '5m' | '1h',
): ContentBlock[] {
  const cacheControl = { type: 'ephemeral' as const }

  if (typeof system === 'string') {
    // convert string to block array so we can attach cache_control
    return [{
      type: 'text',
      text: system,
      cache_control: cacheControl,
    }]
  }

  if (Array.isArray(system) && system.length > 0) {
    const blocks = [...system]
    const last = { ...blocks[blocks.length - 1] }
    last.cache_control = cacheControl
    blocks[blocks.length - 1] = last
    return blocks
  }

  return system
}

function injectMessageCache(msg: Record<string, unknown>): Record<string, unknown> {
  const updated = { ...msg }
  const content = updated.content

  if (typeof content === 'string') {
    updated.content = [{
      type: 'text',
      text: content,
      cache_control: { type: 'ephemeral' },
    }]
  } else if (Array.isArray(content) && content.length > 0) {
    const blocks = [...content]
    const last = { ...blocks[blocks.length - 1] }
    last.cache_control = { type: 'ephemeral' }
    blocks[blocks.length - 1] = last
    updated.content = blocks
  }

  return updated
}

function countBreakpoints(params: Record<string, unknown>): number {
  let count = 0
  const json = JSON.stringify(params)
  const matches = json.match(/cache_control/g)
  return matches ? matches.length : 0
}

function extractMetrics(response: Record<string, unknown>): CacheMetrics {
  const usage = (response.usage || {}) as Record<string, number>
  return {
    cacheCreationTokens: usage.cache_creation_input_tokens || 0,
    cacheReadTokens: usage.cache_read_input_tokens || 0,
    totalInputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    model: (response.model as string) || 'unknown',
    provider: 'anthropic',
  }
}

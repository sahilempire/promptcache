import type { OpenAICacheOptions, CacheMetrics } from '../types.js'
import { StatsTracker } from '../stats/tracker.js'
import { createLogger } from '../utils/logger.js'

type AnyOpenAI = {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<Record<string, unknown>>
    }
  }
  [key: string]: unknown
}

const DEFAULT_OPTIONS: Required<OpenAICacheOptions> = {
  enabled: true,
  minTokens: 1024,
  strategy: 'auto',
  reorderSystemMessages: true,
  trackStats: true,
  debug: false,
  onOptimize: () => {},
  tokenCounter: undefined as unknown as (text: string) => number,
}

/**
 * Optimize OpenAI client for better automatic cache hits.
 *
 * OpenAI caching is automatic — no manual breakpoints needed. But we can
 * still help by reordering messages so the stable prefix is as long as
 * possible. The longer the matching prefix, the more tokens get cached.
 *
 * We also track the cache stats that OpenAI returns so you can see
 * your actual savings.
 */
export function optimizeOpenAI<T extends AnyOpenAI>(
  client: T,
  userOptions?: OpenAICacheOptions,
): T & { stats(): import('../types.js').CacheStats; printStats(): void; resetStats(): void } {
  const opts = { ...DEFAULT_OPTIONS, ...userOptions }
  const log = createLogger(opts.debug)
  const tracker = new StatsTracker()

  log.debug('initialized for openai')

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'stats') return () => tracker.getStats()
      if (prop === 'printStats') return () => tracker.print()
      if (prop === 'resetStats') return () => tracker.reset()

      if (prop === 'chat') {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp) {
            if (chatProp === 'completions') {
              return new Proxy(chatTarget.completions, {
                get(compTarget, compProp) {
                  if (compProp === 'create') {
                    return async (params: Record<string, unknown>) => {
                      if (!opts.enabled) {
                        return compTarget.create.call(compTarget, params)
                      }

                      const optimized = opts.reorderSystemMessages
                        ? reorderForPrefixMatch(params, log)
                        : params

                      const response = await compTarget.create.call(
                        compTarget,
                        optimized,
                      ) as Record<string, unknown>

                      if (opts.trackStats) {
                        tracker.record(extractMetrics(response))
                      }

                      return response
                    }
                  }
                  return Reflect.get(compTarget, compProp)
                },
              })
            }
            return Reflect.get(chatTarget, chatProp)
          },
        })
      }

      return Reflect.get(target, prop)
    },
  }) as T & { stats(): import('../types.js').CacheStats; printStats(): void; resetStats(): void }
}

/**
 * Reorder messages so static system instructions come first,
 * followed by stable content, with variable user input at the end.
 * This maximizes the prefix that OpenAI can match for caching.
 */
function reorderForPrefixMatch(
  params: Record<string, unknown>,
  log: ReturnType<typeof createLogger>,
): Record<string, unknown> {
  const messages = params.messages as Array<{ role: string; content: unknown }> | undefined
  if (!messages || messages.length <= 1) return params

  // separate system messages from the rest
  const systemMsgs = messages.filter(m => m.role === 'system')
  const nonSystemMsgs = messages.filter(m => m.role !== 'system')

  if (systemMsgs.length <= 1) return params

  // sort system messages: longer (more stable) content first
  const sorted = [...systemMsgs].sort((a, b) => {
    const lenA = typeof a.content === 'string' ? a.content.length : JSON.stringify(a.content).length
    const lenB = typeof b.content === 'string' ? b.content.length : JSON.stringify(b.content).length
    return lenB - lenA
  })

  log.debug(`reordered ${systemMsgs.length} system messages for prefix optimization`)

  return {
    ...params,
    messages: [...sorted, ...nonSystemMsgs],
  }
}

function extractMetrics(response: Record<string, unknown>): CacheMetrics {
  const usage = (response.usage || {}) as Record<string, unknown>
  const details = (usage.prompt_tokens_details || {}) as Record<string, number>

  return {
    cacheCreationTokens: 0, // openai doesn't charge extra for cache writes
    cacheReadTokens: details.cached_tokens || 0,
    totalInputTokens: (usage.prompt_tokens as number) || 0,
    outputTokens: (usage.completion_tokens as number) || 0,
    model: (response.model as string) || 'unknown',
    provider: 'openai',
  }
}

import type { CacheOptions, CacheMetrics } from '../types.js'
import { estimateTokens } from '../core/token-estimator.js'
import { hashContent } from '../core/hasher.js'
import { LRU } from '../utils/lru.js'
import { StatsTracker } from '../stats/tracker.js'
import { createLogger } from '../utils/logger.js'

export interface GeminiCacheOptions extends CacheOptions {
  cacheTtlSeconds?: number
  maxCacheEntries?: number
}

interface CacheEntry {
  name: string
  contentHash: string
  createdAt: number
  ttlSeconds: number
}

type AnyGemini = {
  getGenerativeModel: (params: Record<string, unknown>) => unknown
  [key: string]: unknown
}

type AnyCacheManager = {
  create: (params: Record<string, unknown>) => Promise<Record<string, unknown>>
  get: (name: string) => Promise<Record<string, unknown>>
  delete: (name: string) => Promise<void>
  [key: string]: unknown
}

const DEFAULT_OPTIONS = {
  enabled: true,
  minTokens: 32768, // gemini's minimum
  strategy: 'auto' as const,
  cacheTtlSeconds: 600, // 10 minutes
  maxCacheEntries: 50,
  trackStats: true,
  debug: false,
  onOptimize: () => {},
  tokenCounter: undefined as unknown as (text: string) => number,
}

/**
 * Optimize Google Gemini client with automatic context caching.
 *
 * Gemini requires explicit cache management — you create CachedContent
 * objects via the API, then reference them in generation calls. This
 * adapter handles the lifecycle automatically:
 *
 * 1. Hashes your system instruction + static content
 * 2. Checks an in-memory LRU for existing cache refs
 * 3. Creates new CachedContent if needed (>32K tokens)
 * 4. Uses cached model for generation
 * 5. Cleans up expired entries
 *
 * Usage:
 *   const { model, stats, printStats, resetStats } = optimizeGemini(genAI, cacheManager, {
 *     model: 'gemini-2.5-flash',
 *     systemInstruction: 'You are...',
 *     cacheTtlSeconds: 600,
 *   })
 *
 *   const result = await model.generateContent('Hello')
 */
export function optimizeGemini(
  genAI: AnyGemini,
  cacheManager: AnyCacheManager,
  config: {
    model: string
    systemInstruction?: string
    tools?: Record<string, unknown>[]
  } & GeminiCacheOptions,
) {
  const opts = { ...DEFAULT_OPTIONS, ...config }
  const log = createLogger(opts.debug)
  const tracker = new StatsTracker()
  const cacheStore = new LRU<string, CacheEntry>(opts.maxCacheEntries)
  const tokenCounter = opts.tokenCounter || estimateTokens

  log.debug('initialized for gemini', { model: opts.model, ttl: opts.cacheTtlSeconds })

  // figure out what's cacheable
  const staticContent = buildStaticContent(config.systemInstruction, config.tools)
  const staticTokens = tokenCounter(staticContent)
  const contentHash = hashContent(staticContent)
  const shouldCache = staticTokens >= opts.minTokens && opts.enabled

  log.debug(`static content: ${staticTokens} tokens, cache: ${shouldCache ? 'yes' : 'no (below 32K minimum)'}`)

  async function getModel() {
    if (!shouldCache) {
      // not enough tokens to cache — use a regular model
      return genAI.getGenerativeModel({
        model: config.model,
        systemInstruction: config.systemInstruction,
        tools: config.tools,
      })
    }

    // check if we have a valid cache entry
    const existing = cacheStore.get(contentHash)
    if (existing && !isExpired(existing)) {
      log.debug(`cache hit: ${existing.name}`)
      try {
        const cached = await cacheManager.get(existing.name)
        return (genAI as any).getGenerativeModelFromCachedContent?.(cached)
          || genAI.getGenerativeModel({ model: config.model, cachedContent: cached } as any)
      } catch (e) {
        // cache was deleted server-side, recreate
        log.debug('cached content expired server-side, recreating')
        cacheStore.get(contentHash) // trigger LRU access without deletion issues
      }
    }

    // create new cache
    log.debug('creating new cached content')
    try {
      const cached = await cacheManager.create({
        model: config.model,
        systemInstruction: config.systemInstruction,
        contents: [{
          role: 'user',
          parts: [{ text: staticContent }],
        }],
        ttlSeconds: opts.cacheTtlSeconds,
        tools: config.tools,
      })

      const name = (cached.name as string) || `cache-${Date.now()}`
      cacheStore.set(contentHash, {
        name,
        contentHash,
        createdAt: Date.now(),
        ttlSeconds: opts.cacheTtlSeconds,
      })

      log.debug(`cache created: ${name}`)

      return (genAI as any).getGenerativeModelFromCachedContent?.(cached)
        || genAI.getGenerativeModel({ model: config.model, cachedContent: cached } as any)
    } catch (e) {
      // fallback to uncached model
      log.warn('failed to create cache, falling back to uncached model')
      return genAI.getGenerativeModel({
        model: config.model,
        systemInstruction: config.systemInstruction,
        tools: config.tools,
      })
    }
  }

  // wrap the model in a proxy that tracks usage
  const modelProxy = {
    async generateContent(...args: unknown[]) {
      const model = await getModel() as any
      const result = await model.generateContent(...args)

      if (opts.trackStats) {
        tracker.record(extractGeminiMetrics(result, config.model, shouldCache))
      }

      return result
    },

    async generateContentStream(...args: unknown[]) {
      const model = await getModel() as any
      const result = await model.generateContentStream(...args)

      // for streaming, usage comes in the response after stream completes
      // wrap the response promise
      if (result?.response) {
        const originalResponse = result.response
        if (typeof originalResponse === 'object' && typeof originalResponse.then === 'function') {
          result.response = (originalResponse as Promise<Record<string, unknown>>).then(
            (res: Record<string, unknown>) => {
              if (opts.trackStats) {
                tracker.record(extractGeminiMetrics({ response: res }, config.model, shouldCache))
              }
              return res
            }
          )
        }
      }

      return result
    },

    // expose underlying model for advanced usage
    async getBaseModel() {
      return getModel()
    },
  }

  return {
    model: modelProxy,
    stats: () => tracker.getStats(),
    printStats: () => tracker.print(),
    resetStats: () => tracker.reset(),

    // manual cache management
    async clearCache() {
      // no easy way to iterate LRU, but we can clear it
      cacheStore.clear()
      log.debug('cache store cleared')
    },
  }
}

function buildStaticContent(
  systemInstruction?: string,
  tools?: Record<string, unknown>[],
): string {
  const parts: string[] = []
  if (systemInstruction) parts.push(systemInstruction)
  if (tools && tools.length > 0) parts.push(JSON.stringify(tools))
  return parts.join('\n\n')
}

function isExpired(entry: CacheEntry): boolean {
  const elapsed = (Date.now() - entry.createdAt) / 1000
  // treat as expired if >90% of TTL has passed (refresh before it dies)
  return elapsed > entry.ttlSeconds * 0.9
}

function extractGeminiMetrics(
  result: Record<string, unknown>,
  model: string,
  wasCached: boolean,
): CacheMetrics {
  const response = (result.response || result) as Record<string, unknown>
  const usage = (response.usageMetadata || {}) as Record<string, number>

  return {
    cacheCreationTokens: wasCached ? 0 : (usage.promptTokenCount || 0),
    cacheReadTokens: usage.cachedContentTokenCount || 0,
    totalInputTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
    model,
    provider: 'gemini',
  }
}

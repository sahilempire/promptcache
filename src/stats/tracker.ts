import type { CacheStats, CacheMetrics, RequestStat, ModelStats } from '../types.js'

// pricing per million tokens
// sources: platform.claude.com/docs/en/about-claude/pricing
//          openai.com/api/pricing
//          ai.google.dev/pricing
const PRICING: Record<string, { input: number; cachedInput: number; output: number }> = {
  // anthropic — claude 4.x family
  'claude-opus-4-20250514':       { input: 15,   cachedInput: 1.5,    output: 75 },
  'claude-sonnet-4-20250514':     { input: 3,    cachedInput: 0.3,    output: 15 },
  // anthropic — claude 4.5 family
  'claude-opus-4-5-20260301':     { input: 15,   cachedInput: 1.5,    output: 75 },
  'claude-sonnet-4-5-20250620':   { input: 3,    cachedInput: 0.3,    output: 15 },
  // anthropic — claude 4.6 family
  'claude-opus-4-6':              { input: 15,   cachedInput: 1.5,    output: 75 },
  'claude-sonnet-4-6':            { input: 3,    cachedInput: 0.3,    output: 15 },
  // anthropic — claude 3.x
  'claude-haiku-3-5-20241022':    { input: 0.8,  cachedInput: 0.08,   output: 4 },
  'claude-3-5-sonnet-20241022':   { input: 3,    cachedInput: 0.3,    output: 15 },
  // openai — gpt-4.1 family
  'gpt-4.1':                      { input: 2,    cachedInput: 0.5,    output: 8 },
  'gpt-4.1-mini':                 { input: 0.4,  cachedInput: 0.1,    output: 1.6 },
  'gpt-4.1-nano':                 { input: 0.1,  cachedInput: 0.025,  output: 0.4 },
  // openai — gpt-4o family
  'gpt-4o':                       { input: 2.5,  cachedInput: 1.25,   output: 10 },
  'gpt-4o-mini':                  { input: 0.15, cachedInput: 0.075,  output: 0.6 },
  // openai — o-series
  'o3':                           { input: 10,   cachedInput: 2.5,    output: 40 },
  'o3-mini':                      { input: 1.1,  cachedInput: 0.275,  output: 4.4 },
  'o4-mini':                      { input: 1.1,  cachedInput: 0.275,  output: 4.4 },
  // google — gemini
  'gemini-2.5-pro':               { input: 1.25, cachedInput: 0.315,  output: 10 },
  'gemini-2.5-flash':             { input: 0.15, cachedInput: 0.0375, output: 0.6 },
  'gemini-2.0-flash':             { input: 0.1,  cachedInput: 0.025,  output: 0.4 },
}

const FALLBACK_PRICING = { input: 3, cachedInput: 0.3, output: 15 }

export class StatsTracker {
  private history: RequestStat[] = []
  private maxHistory = 1000

  record(metrics: CacheMetrics): void {
    const pricing = PRICING[metrics.model] || FALLBACK_PRICING

    const uncachedCost =
      ((metrics.totalInputTokens + metrics.cacheReadTokens) / 1_000_000) * pricing.input +
      (metrics.outputTokens / 1_000_000) * pricing.output

    const actualCost =
      (metrics.totalInputTokens / 1_000_000) * pricing.input +
      (metrics.cacheReadTokens / 1_000_000) * pricing.cachedInput +
      (metrics.cacheCreationTokens / 1_000_000) * pricing.input * 1.25 +
      (metrics.outputTokens / 1_000_000) * pricing.output

    const savings = Math.max(uncachedCost - actualCost, 0)

    const stat: RequestStat = {
      timestamp: Date.now(),
      provider: metrics.provider,
      model: metrics.model,
      inputTokens: metrics.totalInputTokens,
      cachedTokens: metrics.cacheReadTokens,
      cacheCreationTokens: metrics.cacheCreationTokens,
      outputTokens: metrics.outputTokens,
      estimatedCostUsd: actualCost,
      estimatedSavingsUsd: savings,
    }

    this.history.push(stat)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  getStats(): CacheStats {
    const totalRequests = this.history.length
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        totalInputTokens: 0,
        cachedInputTokens: 0,
        cacheCreationTokens: 0,
        estimatedSavingsUsd: 0,
        estimatedSavingsPercent: 0,
        byModel: {},
        history: [],
      }
    }

    let cacheHits = 0
    let totalInputTokens = 0
    let cachedInputTokens = 0
    let cacheCreationTokens = 0
    let totalSavings = 0
    let totalCostWithout = 0

    const byModel: Record<string, ModelStats> = {}

    for (const stat of this.history) {
      if (stat.cachedTokens > 0) cacheHits++
      totalInputTokens += stat.inputTokens
      cachedInputTokens += stat.cachedTokens
      cacheCreationTokens += stat.cacheCreationTokens
      totalSavings += stat.estimatedSavingsUsd

      const pricing = PRICING[stat.model] || FALLBACK_PRICING
      totalCostWithout +=
        ((stat.inputTokens + stat.cachedTokens) / 1_000_000) * pricing.input +
        (stat.outputTokens / 1_000_000) * pricing.output

      if (!byModel[stat.model]) {
        byModel[stat.model] = {
          requests: 0,
          totalInputTokens: 0,
          cachedInputTokens: 0,
          estimatedSavingsUsd: 0,
        }
      }
      byModel[stat.model].requests++
      byModel[stat.model].totalInputTokens += stat.inputTokens
      byModel[stat.model].cachedInputTokens += stat.cachedTokens
      byModel[stat.model].estimatedSavingsUsd += stat.estimatedSavingsUsd
    }

    return {
      totalRequests,
      cacheHits,
      cacheMisses: totalRequests - cacheHits,
      hitRate: cacheHits / totalRequests,
      totalInputTokens,
      cachedInputTokens,
      cacheCreationTokens,
      estimatedSavingsUsd: round(totalSavings),
      estimatedSavingsPercent: totalCostWithout > 0
        ? round((totalSavings / totalCostWithout) * 100)
        : 0,
      byModel,
      history: this.history.slice(-50), // last 50 for export
    }
  }

  print(): void {
    const stats = this.getStats()

    const lines = [
      '',
      '  \x1b[1mprompтcache\x1b[0m',
      `  Requests:      ${stats.totalRequests}`,
      `  Cache hits:    ${stats.cacheHits} (${(stats.hitRate * 100).toFixed(1)}%)`,
      `  Tokens cached: ${formatNumber(stats.cachedInputTokens)}`,
      `  Saved:         $${stats.estimatedSavingsUsd.toFixed(2)} (${stats.estimatedSavingsPercent.toFixed(1)}%)`,
    ]

    const models = Object.entries(stats.byModel)
    if (models.length > 0) {
      lines.push('')
      for (const [model, data] of models) {
        const shortName = model.length > 24 ? model.slice(0, 22) + '..' : model
        lines.push(`  ${shortName}: ${data.requests} reqs, $${data.estimatedSavingsUsd.toFixed(2)} saved`)
      }
    }

    const boxWidth = Math.max(...lines.map(l => stripAnsi(l).length)) + 2
    const top = '┌' + '─'.repeat(boxWidth) + '┐'
    const bottom = '└' + '─'.repeat(boxWidth) + '┘'

    console.log(top)
    for (const line of lines) {
      const padding = boxWidth - stripAnsi(line).length
      console.log('│' + line + ' '.repeat(padding) + '│')
    }
    console.log(bottom)
  }

  reset(): void {
    this.history = []
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

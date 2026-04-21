# promptcache

Auto-optimize LLM prompt caching. One line of code, 60-90% savings on your API bill.

[![npm](https://img.shields.io/npm/v/promptcache)](https://www.npmjs.com/package/promptcache)
[![license](https://img.shields.io/npm/l/promptcache)](./LICENSE)

---

## The problem

Every time you call Claude or GPT, you send the same system prompt, the same tool definitions, the same few-shot examples. You pay full price for those tokens every single time.

Anthropic and OpenAI both support prompt caching (up to 90% off cached tokens), but setting it up correctly is manual, tedious, and easy to get wrong.

**promptcache does it for you automatically.**

## Install

```bash
npm install promptcache
```

## Quick start

### Anthropic (Claude)

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { optimizeAnthropic } from 'promptcache'

const client = optimizeAnthropic(new Anthropic())

// use it exactly like you normally would — nothing changes
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: 'You are a helpful cooking assistant who knows every recipe from every cuisine around the world...',
  messages: [{ role: 'user', content: 'How do I make biryani?' }],
})

// check your savings
client.printStats()
```

Output:
```
┌──────────────────────────────────────────────┐
│                                              │
│  promptcache                                 │
│  Requests:      48                           │
│  Cache hits:    42 (87.5%)                   │
│  Tokens cached: 284.2K                       │
│  Saved:         $2.14 (84.3%)                │
│                                              │
└──────────────────────────────────────────────┘
```

### OpenAI (GPT)

```typescript
import OpenAI from 'openai'
import { optimizeOpenAI } from 'promptcache'

const client = optimizeOpenAI(new OpenAI())

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant...' },
    { role: 'user', content: 'Hello' },
  ],
})

client.printStats()
```

## How it works

**For Anthropic:** promptcache analyzes your prompt structure, identifies stable segments (system instructions, tool definitions, documents), and automatically injects `cache_control` breakpoints at optimal positions. Cached tokens cost 90% less on subsequent requests.

**For OpenAI:** Caching is automatic on their end, but the cache only hits if your prompt prefix matches. promptcache reorders your system messages so the longest, most stable content comes first — maximizing the prefix match and your cache hit rate.

The whole thing is a transparent proxy. Your existing code doesn't change. You just wrap your client once.

## Configuration

```typescript
const client = optimizeAnthropic(new Anthropic(), {
  strategy: 'auto',       // 'auto' | 'aggressive' | 'conservative' | 'none'
  maxBreakpoints: 4,       // 1-4 breakpoints (Anthropic limit)
  ttl: '5m',               // '5m' or '1h'
  minTokens: 1024,         // don't cache segments below this
  debug: false,            // log optimization decisions
  onOptimize: (event) => {
    // hook into optimization events
    console.log(`placed ${event.breakpointsPlaced} breakpoints`)
  },
})
```

| Option | Default | Description |
|--------|---------|-------------|
| `strategy` | `'auto'` | How aggressively to cache. `auto` is usually right. |
| `maxBreakpoints` | `4` | Max cache breakpoints (Anthropic allows up to 4) |
| `ttl` | `'5m'` | Cache TTL. `'1h'` costs more to create but lasts longer. |
| `minTokens` | `1024` | Skip caching segments smaller than this |
| `debug` | `false` | Print optimization decisions to console |
| `trackStats` | `true` | Track cache hit rates and cost savings |

## Stats API

```typescript
// get stats programmatically
const stats = client.stats()
console.log(stats.hitRate)              // 0.875
console.log(stats.estimatedSavingsUsd)  // 2.14
console.log(stats.byModel)             // per-model breakdown

// pretty print
client.printStats()

// reset
client.resetStats()
```

## Provider comparison

| | Anthropic | OpenAI |
|---|---|---|
| Cache type | Manual breakpoints (we handle it) | Automatic prefix matching |
| Savings | Up to 90% on cached tokens | Up to 50% on cached tokens |
| Min tokens | 1,024 | 1,024 |
| TTL | 5 min or 1 hour | 5-10 min |
| What promptcache does | Injects `cache_control` breakpoints | Reorders messages for better prefix match |

## Standalone analysis

Don't want to wrap your client? You can just analyze prompts:

```typescript
import { PromptAnalyzer } from 'promptcache'

const analyzer = new PromptAnalyzer()
const analysis = analyzer.analyzeAnthropicParams({
  system: 'Your long system prompt...',
  tools: [/* your tools */],
  messages: [/* conversation */],
})

console.log(analysis.estimatedSavingsPercent) // 74
console.log(analysis.stableSegments)          // what should be cached
console.log(analysis.variableSegments)        // what changes each request
```

## Design decisions

- **Zero runtime dependencies.** No tiktoken, no Redis, no nothing. Token estimation uses a fast heuristic (~15% accuracy). If you need exact counts, pass a custom `tokenCounter`.
- **In-memory only.** No external storage. Cache knowledge resets on restart, but that matches the provider-side TTL anyway.
- **Proxy-based.** Uses JavaScript Proxy to wrap your client transparently. All original methods and types pass through unchanged.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions.

## License

MIT

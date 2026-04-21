<p align="center">
  <h1 align="center">promptcache</h1>
  <p align="center">
    Auto-optimize LLM prompt caching. One line of code, 60-90% savings on your API bill.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/promptcache"><img src="https://img.shields.io/npm/v/promptcache?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/promptcache?style=flat-square&color=blue" alt="license"></a>
  <a href="https://github.com/sahilempire/promptcache/actions"><img src="https://img.shields.io/github/actions/workflow/status/sahilempire/promptcache/ci.yml?style=flat-square&label=tests" alt="CI"></a>
  <a href="https://github.com/sahilempire/promptcache"><img src="https://img.shields.io/github/stars/sahilempire/promptcache?style=flat-square" alt="stars"></a>
</p>

---

## The Problem

Every time you call Claude or GPT, you send the same tokens over and over:

```
Call 1:  [System prompt: 2000 tokens] + "recipe for pasta"     → you pay for 2000 + query
Call 2:  [System prompt: 2000 tokens] + "recipe for biryani"   → you pay for 2000 + query again
Call 3:  [System prompt: 2000 tokens] + "recipe for dosa"      → and again...
```

You're paying full price for the **same instructions** on every single request.

Anthropic and OpenAI both support prompt caching (up to **90% off** cached tokens), but configuring it correctly is manual, tedious, and easy to mess up.

**promptcache does it for you. Automatically. In one line.**

---

## Install

```bash
npm install promptcache
```

---

## Quick Start

### Anthropic (Claude) — saves up to 90%

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { optimizeAnthropic } from 'promptcache'

// wrap your client — that's the only change
const client = optimizeAnthropic(new Anthropic())

// everything else stays exactly the same
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: 'You are a helpful cooking assistant who knows every recipe from every cuisine...',
  messages: [{ role: 'user', content: 'How do I make biryani?' }],
})

// see what you saved
client.printStats()
```

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

### OpenAI (GPT) — saves up to 50%

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

---

## What It Does

<table>
<tr>
<td width="50%">

**Without promptcache**

```
You → send 2000 token system prompt
API → charges you full price

You → send same 2000 tokens again
API → charges you full price again

You → send same 2000 tokens again
API → charges you full price again

Monthly bill: $300
```

</td>
<td width="50%">

**With promptcache**

```
You → send 2000 token system prompt
API → caches it (small extra charge)

You → send same 2000 tokens again
API → cache hit! 90% off

You → send same 2000 tokens again
API → cache hit! 90% off

Monthly bill: $40
```

</td>
</tr>
</table>

---

## How It Works

### For Anthropic (Claude)

promptcache sits between your code and the API. It:

1. **Analyzes** your prompt — finds system instructions, tool definitions, documents
2. **Scores** each segment — is this stable (same every call) or variable (changes each call)?
3. **Injects** `cache_control` breakpoints at the right positions
4. **Tracks** cache hit rates and shows you the actual dollar savings

All transparent. Your code doesn't change. The API gets optimized params.

### For OpenAI (GPT)

OpenAI caching is automatic — but it only works if your prompt prefix matches across requests. promptcache reorders your system messages so the longest, most stable content comes first, maximizing the prefix match.

---

## Configuration

```typescript
const client = optimizeAnthropic(new Anthropic(), {
  strategy: 'auto',
  maxBreakpoints: 4,
  ttl: '5m',
  minTokens: 1024,
  debug: false,
  onOptimize: (event) => {
    console.log(`placed ${event.breakpointsPlaced} breakpoints`)
  },
})
```

| Option | Default | What it does |
|:-------|:--------|:-------------|
| `strategy` | `'auto'` | How aggressively to cache — `auto` works for most cases, `aggressive` caches more, `conservative` only caches very stable segments |
| `maxBreakpoints` | `4` | Number of cache breakpoints to use (Anthropic allows 1-4) |
| `ttl` | `'5m'` | Cache lifetime — `'5m'` is cheaper to create, `'1h'` lasts longer but costs more upfront |
| `minTokens` | `1024` | Don't bother caching segments smaller than this (not worth it) |
| `debug` | `false` | Log every optimization decision to console |
| `trackStats` | `true` | Track cache hits, misses, and cost savings |
| `onOptimize` | — | Hook called after each request is optimized |

---

## Stats API

```typescript
// programmatic access
const stats = client.stats()
stats.hitRate              // 0.875
stats.estimatedSavingsUsd  // 2.14
stats.estimatedSavingsPercent // 84.3
stats.totalRequests        // 48
stats.cacheHits            // 42
stats.byModel              // per-model breakdown

// pretty terminal output
client.printStats()

// start fresh
client.resetStats()
```

---

## Provider Comparison

| | Anthropic (Claude) | OpenAI (GPT) |
|:---|:---|:---|
| **How caching works** | Manual — you mark breakpoints with `cache_control` | Automatic — prefix matching, no control |
| **Max savings** | **90%** on cached tokens | **50%** on cached tokens |
| **Min tokens to cache** | 1,024 | 1,024 |
| **Cache TTL** | 5 min or 1 hour | 5-10 min |
| **What promptcache does** | Injects `cache_control` breakpoints automatically | Reorders messages for better prefix matching |
| **Cache write cost** | +25% (5min) or +100% (1hr) | Free |

---

## Standalone Analysis

Don't want the wrapper? Just analyze your prompts to see what's cacheable:

```typescript
import { PromptAnalyzer } from 'promptcache'

const analyzer = new PromptAnalyzer()
const analysis = analyzer.analyzeAnthropicParams({
  system: 'Your long system prompt here...',
  tools: [/* your tool definitions */],
  messages: [/* conversation history */],
})

console.log(analysis.estimatedSavingsPercent) // 74
console.log(analysis.stableSegments)          // what should be cached
console.log(analysis.variableSegments)        // what changes each request
console.log(analysis.cacheableTokens)         // total tokens worth caching
```

---

## Design Principles

- **Zero dependencies** — no tiktoken (3MB wasm), no Redis, no external services. Token estimation uses a fast heuristic. If you need exact counts, pass a custom `tokenCounter` in options.

- **Zero infrastructure** — everything runs in-process. No proxy servers, no databases, no config files. `npm install` and you're done.

- **Zero code changes** — uses JavaScript `Proxy` to wrap your existing client. All original methods, properties, and TypeScript types pass through unchanged.

- **< 15KB gzipped** — smaller than most icons on your page.

---

## Examples

Check the [`examples/`](./examples) directory:

- [`anthropic-basic.ts`](./examples/anthropic-basic.ts) — simplest usage, cooking assistant
- [`openai-basic.ts`](./examples/openai-basic.ts) — GPT code review scenario
- [`with-tools.ts`](./examples/with-tools.ts) — caching tool definitions (travel assistant with 4 tools)
- [`analyze-prompt.ts`](./examples/analyze-prompt.ts) — standalone prompt analysis without wrapping

---

## Roadmap

- [x] Anthropic adapter (auto `cache_control` injection)
- [x] OpenAI adapter (prefix optimization)
- [x] Stats tracking with cost estimation
- [x] Standalone prompt analysis
- [ ] Gemini adapter ([#1](https://github.com/sahilempire/promptcache/issues/1))
- [ ] Streaming support ([#2](https://github.com/sahilempire/promptcache/issues/2))
- [ ] Vercel AI SDK middleware ([#4](https://github.com/sahilempire/promptcache/issues/4))
- [ ] CLI tool for analyzing prompts in your codebase
- [ ] Python package (`pip install promptcache`)

---

## Contributing

Contributions are welcome! Check the [open issues](https://github.com/sahilempire/promptcache/issues) — anything tagged `good first issue` is a great place to start.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for dev setup.

---

## License

[MIT](./LICENSE)

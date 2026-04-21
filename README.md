<p align="center">
  <h1 align="center">cachellm</h1>
  <p align="center">
    Auto-optimize LLM prompt caching. One line of code, 60-90% savings on your API bill.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cachellm"><img src="https://img.shields.io/npm/v/cachellm?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/cachellm?style=flat-square&color=blue" alt="license"></a>
  <a href="https://github.com/sahilempire/cachellm/actions"><img src="https://img.shields.io/github/actions/workflow/status/sahilempire/cachellm/ci.yml?style=flat-square&label=tests" alt="CI"></a>
  <a href="https://github.com/sahilempire/cachellm"><img src="https://img.shields.io/github/stars/sahilempire/cachellm?style=flat-square" alt="stars"></a>
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

**cachellm does it for you. Automatically. In one line.**

---

## Install

```bash
npm install cachellm
```

---

## Quick Start

### Anthropic (Claude) — saves up to 90%

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { optimizeAnthropic } from 'cachellm'

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
┌──────────────────────────────────────────────────┐
│                                                  │
│  cachellm                                        │
│  Requests:      48                               │
│  Cache hits:    42 (87.5%)                        │
│  Tokens cached: 284.2K                           │
│  Saved:         $2.14 (84.3%)                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### OpenAI (GPT) — saves up to 50%

```typescript
import OpenAI from 'openai'
import { optimizeOpenAI } from 'cachellm'

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

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Application                         │
│                                                                 │
│   const client = optimizeAnthropic(new Anthropic())             │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      cachellm (Proxy Layer)                     │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Analyzer    │  │  Strategy    │  │  Stats Tracker         │ │
│  │             │  │              │  │                        │ │
│  │ scores each │  │ picks where  │  │ tracks hits, misses,   │ │
│  │ segment by  │  │ to place     │  │ tokens, and cost       │ │
│  │ stability   │  │ breakpoints  │  │ savings per request    │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬───────────┘ │
│         │                │                       │              │
│         ▼                ▼                       │              │
│  ┌─────────────────────────────────┐             │              │
│  │  Provider Adapters              │             │              │
│  │                                 │             │              │
│  │  ┌───────────┐ ┌─────────────┐ │             │              │
│  │  │ Anthropic │ │   OpenAI    │ │             │              │
│  │  │           │ │             │ │             │              │
│  │  │ injects   │ │ reorders    │ │             │              │
│  │  │ cache_    │ │ messages    │ │             │              │
│  │  │ control   │ │ for prefix  │ │             │              │
│  │  │ breaks    │ │ matching    │ │             │              │
│  │  └─────┬─────┘ └──────┬──────┘ │             │              │
│  └────────┼──────────────┼────────┘             │              │
│           │              │                       │              │
└───────────┼──────────────┼───────────────────────┼──────────────┘
            │              │                       │
            ▼              ▼                       ▼
┌─────────────────┐ ┌─────────────┐  ┌─────────────────────────┐
│  Claude API     │ │  GPT API    │  │  Terminal / Dashboard    │
│                 │ │             │  │                         │
│  cache_control  │ │  automatic  │  │  ┌───────────────────┐  │
│  breakpoints    │ │  prefix     │  │  │ Saved: $104/month │  │
│  → 90% off      │ │  matching   │  │  │ Hit rate: 87.5%   │  │
│  cached tokens  │ │  → 50% off  │  │  └───────────────────┘  │
└─────────────────┘ └─────────────┘  └─────────────────────────┘
```

---

## How The Analysis Works

```
┌─────────────────────────── Your Prompt ───────────────────────────┐
│                                                                   │
│  ┌─ System Prompt ──────────────────────────────────────────────┐ │
│  │  "You are a cooking expert who knows recipes from every      │ │
│  │   cuisine. You provide step-by-step instructions with        │ │
│  │   quantities, prep time, and cooking tips..."                │ │
│  │                                                              │ │
│  │  Stability: ████████████████████████████████████████ 0.95    │ │
│  │  Tokens:    ~2,100                                          │ │
│  │  Verdict:   ✅ CACHE THIS (saves ~$0.006/request)           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Tool Definitions ──────────────────────────────────────────┐ │
│  │  get_weather, search_restaurants, book_reservation          │ │
│  │  (3 tools with full JSON schemas)                           │ │
│  │                                                              │ │
│  │  Stability: ████████████████████████████████████████ 0.95    │ │
│  │  Tokens:    ~800                                            │ │
│  │  Verdict:   ✅ CACHE THIS                                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Conversation History ──────────────────────────────────────┐ │
│  │  User: "What's the weather in Paris?"                       │ │
│  │  Assistant: "Currently 18°C and sunny..."                   │ │
│  │  User: "Find me a good restaurant nearby"                   │ │
│  │                                                              │ │
│  │  Older turns:                                                │ │
│  │  Stability: ██████████████████████░░░░░░░░░░░░░░░░░ 0.70    │ │
│  │  Last turn:                                                  │ │
│  │  Stability: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.10    │ │
│  │  Verdict:   ⏭️  SKIP (changes every request)                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Estimated savings: 84% on input tokens                          │
└───────────────────────────────────────────────────────────────────┘
```

---

## What It Does — Before & After

<table>
<tr>
<td width="50%">

**Without cachellm**

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

**With cachellm**

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

## Provider Support

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Supported Providers                             │
│                                                                          │
│  ┌─ Anthropic (Claude) ──────┐  ┌─ OpenAI (GPT) ──────────────────┐    │
│  │                           │  │                                  │    │
│  │  Method:  Manual          │  │  Method:  Automatic              │    │
│  │           breakpoints     │  │           prefix matching        │    │
│  │                           │  │                                  │    │
│  │  Savings: up to 90%       │  │  Savings: up to 50%             │    │
│  │  Min tokens: 1,024        │  │  Min tokens: 1,024              │    │
│  │  TTL: 5 min / 1 hour      │  │  TTL: 5-10 min                  │    │
│  │                           │  │                                  │    │
│  │  cachellm injects         │  │  cachellm reorders              │    │
│  │  cache_control            │  │  messages for better             │    │
│  │  breakpoints at           │  │  prefix matching                 │    │
│  │  optimal positions        │  │                                  │    │
│  └───────────────────────────┘  └──────────────────────────────────┘    │
│                                                                          │
│  ┌─ Gemini (coming soon) ────┐                                          │
│  │                           │  Track progress: github.com/             │
│  │  Method:  Explicit cache  │  sahilempire/cachellm/issues/1           │
│  │           objects via API │                                          │
│  │  Savings: up to 90%       │                                          │
│  │  Min tokens: 32,768       │                                          │
│  └───────────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Cost Savings Breakdown

```
                     Without cachellm          With cachellm
                     ─────────────────         ───────────────
  100 requests/day   │██████████████│ $9.00    │██│ $1.35          ← save $7.65/day
  500 requests/day   │██████████████│ $45.00   │██│ $6.75          ← save $38.25/day
  1K  requests/day   │██████████████│ $90.00   │██│ $13.50         ← save $76.50/day
  10K requests/day   │██████████████│ $900     │██│ $135           ← save $765/day

  * Based on 3K token system prompt, Claude Sonnet, 90% cache hit rate
  * Actual savings depend on your prompt structure and call patterns
```

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

## Standalone Analysis

Don't want the wrapper? Just analyze your prompts to see what's cacheable:

```typescript
import { PromptAnalyzer } from 'cachellm'

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

## Project Structure

```
cachellm/
├── src/
│   ├── index.ts                 ← public API (re-exports everything)
│   ├── types.ts                 ← TypeScript interfaces
│   │
│   ├── core/
│   │   ├── analyzer.ts          ← scores prompt segments for cacheability
│   │   ├── hasher.ts            ← content fingerprinting (djb2)
│   │   ├── differ.ts            ← tracks stability across requests
│   │   ├── strategy.ts          ← breakpoint placement algorithm
│   │   └── token-estimator.ts   ← fast token counting (no tiktoken)
│   │
│   ├── providers/
│   │   ├── anthropic.ts         ← injects cache_control via Proxy
│   │   └── openai.ts            ← reorders for prefix matching
│   │
│   ├── stats/
│   │   └── tracker.ts           ← records hits, calculates savings
│   │
│   └── utils/
│       ├── lru.ts               ← zero-dep LRU cache (~60 lines)
│       └── logger.ts            ← debug logging
│
├── tests/                       ← 35 tests, all passing
├── examples/                    ← ready-to-run usage examples
└── .github/workflows/           ← CI + automated npm releases
```

---

## Design Principles

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Zero dependencies          No tiktoken (3MB), no Redis,         │
│  ────────────────           no external services. Token          │
│                             estimation uses a fast heuristic.    │
│                                                                  │
│  Zero infrastructure        Everything runs in-process.          │
│  ────────────────────       No proxy, no database, no config.    │
│                             npm install and you're done.         │
│                                                                  │
│  Zero code changes          JavaScript Proxy wraps your client.  │
│  ────────────────           All methods, props, and TS types     │
│                             pass through unchanged.              │
│                                                                  │
│  < 15KB gzipped             Smaller than most icons on           │
│  ──────────────             your page.                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

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
- [ ] Gemini adapter ([#1](https://github.com/sahilempire/cachellm/issues/1))
- [ ] Streaming support ([#2](https://github.com/sahilempire/cachellm/issues/2))
- [ ] Vercel AI SDK middleware ([#4](https://github.com/sahilempire/cachellm/issues/4))
- [ ] CLI tool for analyzing prompts in your codebase
- [ ] Python package (`pip install cachellm`)

---

## Contributing

Contributions are welcome! Check the [open issues](https://github.com/sahilempire/cachellm/issues) — anything tagged `good first issue` is a great place to start.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for dev setup.

---

## License

[MIT](./LICENSE)

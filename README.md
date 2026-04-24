<p align="center">
  <h1 align="center">cachellm</h1>
  <p align="center">
    Auto-optimize LLM prompt caching. One line of code, 60-90% savings on your API bill.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cachellm"><img src="https://img.shields.io/npm/v/cachellm?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="https://pypi.org/project/cachellm-py/"><img src="https://img.shields.io/pypi/v/cachellm-py?style=flat-square&color=3775A9" alt="PyPI"></a>
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
npm install cachellm        # node / typescript
pip install cachellm-py     # python
```

---

## Quick Start

### Node.js / TypeScript

#### Anthropic (Claude) — saves up to 90%

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

#### OpenAI (GPT) — saves up to 50%

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

### Python

#### Anthropic (Claude)

```python
from anthropic import Anthropic
from cachellm import optimize_anthropic

client = optimize_anthropic(Anthropic())

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system="You are a helpful cooking assistant...",
    messages=[{"role": "user", "content": "How do I make biryani?"}],
)

client.print_stats()
```

#### OpenAI (GPT)

```python
from openai import OpenAI
from cachellm import optimize_openai

client = optimize_openai(OpenAI())

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant..."},
        {"role": "user", "content": "Hello"},
    ],
)

client.print_stats()
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

## How It Works

1. **Analyze** — scans your prompt structure, identifies system instructions, tool schemas, and conversation history
2. **Score** — rates each segment by stability using content hashing and positional heuristics
3. **Inject** — places `cache_control` breakpoints at optimal positions (Anthropic) or reorders messages for prefix matching (OpenAI)
4. **Track** — monitors cache hit rates, token counts, and calculates real dollar savings

---

## Provider Support

| Provider | Method | Savings | Min Tokens | TTL |
|:---------|:-------|:--------|:-----------|:----|
| **Anthropic** (Claude) | `cache_control` injection | up to 90% | 1,024 | 5min / 1hr |
| **OpenAI** (GPT) | Prefix reordering | up to 50% | 1,024 | 5-10min |
| **Gemini** | Cache object management | up to 90% | 32,768 | Configurable |

---

## Cost Savings

| Scale | Without | With cachellm | Saved/day |
|:------|:--------|:--------------|:----------|
| 100 req/day | $9.00 | $1.35 | $7.65 |
| 500 req/day | $45.00 | $6.75 | $38.25 |
| 1,000 req/day | $90.00 | $13.50 | $76.50 |
| 10,000 req/day | $900 | $135 | $765 |

*Based on 3K token system prompt, Claude Sonnet, 90% cache hit rate*

---

## Configuration

<details>
<summary><b>TypeScript</b></summary>

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

</details>

<details>
<summary><b>Python</b></summary>

```python
from cachellm import optimize_anthropic
from cachellm.types import AnthropicCacheOptions

client = optimize_anthropic(Anthropic(), AnthropicCacheOptions(
    strategy="auto",
    max_breakpoints=4,
    ttl="5m",
    min_tokens=1024,
    debug=False,
))
```

</details>

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

<details>
<summary><b>TypeScript</b></summary>

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

</details>

<details>
<summary><b>Python</b></summary>

```python
from cachellm import PromptAnalyzer

analyzer = PromptAnalyzer()
analysis = analyzer.analyze_anthropic_params({
    "system": "Your long system prompt here...",
    "tools": [{"name": "search", "description": "Search the web", "input_schema": {"type": "object"}}],
    "messages": [{"role": "user", "content": "Hello"}],
})

print(analysis.estimated_savings_percent)  # 74
print(analysis.stable_segments)            # what should be cached
print(analysis.variable_segments)          # what changes each request
print(analysis.cacheable_tokens)           # total tokens worth caching
```

</details>

---

## Project Structure

```
cachellm/
├── src/                             ← TypeScript source (npm package)
│   ├── index.ts                     ← public API
│   ├── types.ts                     ← TypeScript interfaces
│   ├── core/
│   │   ├── analyzer.ts              ← scores prompt segments for cacheability
│   │   ├── hasher.ts                ← content fingerprinting (djb2)
│   │   ├── differ.ts                ← tracks stability across requests
│   │   ├── strategy.ts              ← breakpoint placement algorithm
│   │   └── token-estimator.ts       ← fast token counting (no tiktoken)
│   ├── providers/
│   │   ├── anthropic.ts             ← injects cache_control via Proxy
│   │   ├── openai.ts                ← reorders for prefix matching
│   │   └── gemini.ts                ← cache object lifecycle management
│   ├── stats/
│   │   └── tracker.ts               ← records hits, calculates savings
│   └── utils/
│       ├── lru.ts                   ← zero-dep LRU cache
│       └── logger.ts               ← debug logging
│
├── python/                          ← Python source (PyPI package)
│   ├── cachellm/
│   │   ├── core/                    ← same analysis engine, ported to Python
│   │   ├── providers/               ← Anthropic, OpenAI, Gemini adapters
│   │   ├── stats/                   ← usage tracking
│   │   └── utils/                   ← LRU cache, logger
│   └── tests/                       ← 44 tests, all passing
│
├── tests/                           ← TypeScript tests (62 tests)
├── examples/                        ← ready-to-run usage examples
├── website/                         ← Next.js landing page
└── .github/workflows/               ← CI + automated npm/PyPI releases
```

---

## Design Principles

- **Zero dependencies** — no tiktoken (3MB), no Redis, no external services. Token estimation uses a fast heuristic.
- **Zero infrastructure** — everything runs in-process. No proxy, no database, no config. Install and you're done.
- **Zero code changes** — wraps your existing client. All methods, props, and types pass through unchanged.
- **< 15KB gzipped** — smaller than most favicons.

---

## Examples

Check the [`examples/`](./examples) directory:

- [`anthropic-basic.ts`](./examples/anthropic-basic.ts) — simplest usage, cooking assistant
- [`openai-basic.ts`](./examples/openai-basic.ts) — GPT code review scenario
- [`with-tools.ts`](./examples/with-tools.ts) — caching tool definitions (travel assistant with 4 tools)
- [`analyze-prompt.ts`](./examples/analyze-prompt.ts) — standalone prompt analysis without wrapping

---

## Contributing

Contributions are welcome! Check the [open issues](https://github.com/sahilempire/cachellm/issues) — anything tagged `good first issue` is a great place to start.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for dev setup.

---

## License

[MIT](./LICENSE)

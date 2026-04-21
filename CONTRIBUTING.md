# Contributing to cachellm

Thanks for wanting to help out. Here's how to get started.

## Setup

```bash
git clone https://github.com/sahilempire/cachellm.git
cd cachellm
npm install
```

## Development

```bash
npm test          # run tests
npm run test:watch # watch mode
npm run typecheck  # type checking
npm run build      # build for production
```

## Codebase map

```
src/
├── core/           # the analysis engine
│   ├── analyzer.ts     # scores prompt segments for cacheability
│   ├── hasher.ts       # content fingerprinting
│   ├── differ.ts       # tracks what's stable across requests
│   ├── strategy.ts     # decides where to place breakpoints
│   └── token-estimator.ts  # fast token counting (no tiktoken)
├── providers/      # platform-specific adapters
│   ├── anthropic.ts    # injects cache_control into Claude calls
│   └── openai.ts       # reorders messages for GPT cache hits
├── stats/          # tracking and reporting
│   └── tracker.ts      # records hits, calculates savings
└── utils/
    ├── lru.ts          # simple LRU cache
    └── logger.ts       # debug logging
```

## Making changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests if needed
4. Run `npm test` and `npm run typecheck`
5. Open a PR

## Rules

- **No new runtime dependencies.** This is a hard rule. Everything ships as part of the package.
- **TypeScript strict mode.** No `any` unless absolutely necessary.
- **Tests for new features.** Doesn't have to be 100% coverage, but the happy path should be covered.

## Not sure where to start?

Check the issues tagged `good first issue` — those are scoped and ready to pick up.

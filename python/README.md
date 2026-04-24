# cachellm

Auto-optimize LLM prompt caching. One line of code, 60-90% savings on your API bill.

## Install

```bash
pip install cachellm
```

## Quick Start

### Anthropic (Claude) — saves up to 90%

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

### OpenAI (GPT) — saves up to 50%

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

## Configuration

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

## Standalone Analysis

```python
from cachellm import PromptAnalyzer

analyzer = PromptAnalyzer()
analysis = analyzer.analyze_anthropic_params({
    "system": "Your long system prompt here...",
    "tools": [{"name": "search", "description": "Search the web", "input_schema": {"type": "object"}}],
    "messages": [{"role": "user", "content": "Hello"}],
})

print(f"Cacheable: {analysis.cacheable_tokens} tokens")
print(f"Estimated savings: ~{analysis.estimated_savings_percent}%")
```

## Requirements

- Python >= 3.9
- Zero dependencies (provider SDKs are optional)

## License

[MIT](../LICENSE)

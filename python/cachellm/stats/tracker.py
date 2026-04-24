from __future__ import annotations

import re
import time
from typing import Dict, List

from cachellm.types import CacheMetrics, CacheStats, ModelStats, RequestStat

# pricing per million tokens
PRICING: Dict[str, Dict[str, float]] = {
    # anthropic — claude 4.x family
    "claude-opus-4-20250514":       {"input": 15,   "cached_input": 1.5,    "output": 75},
    "claude-sonnet-4-20250514":     {"input": 3,    "cached_input": 0.3,    "output": 15},
    # anthropic — claude 4.5 family
    "claude-opus-4-5-20260301":     {"input": 15,   "cached_input": 1.5,    "output": 75},
    "claude-sonnet-4-5-20250620":   {"input": 3,    "cached_input": 0.3,    "output": 15},
    # anthropic — claude 4.6 family
    "claude-opus-4-6":              {"input": 15,   "cached_input": 1.5,    "output": 75},
    "claude-sonnet-4-6":            {"input": 3,    "cached_input": 0.3,    "output": 15},
    # anthropic — claude 3.x
    "claude-haiku-3-5-20241022":    {"input": 0.8,  "cached_input": 0.08,   "output": 4},
    "claude-3-5-sonnet-20241022":   {"input": 3,    "cached_input": 0.3,    "output": 15},
    # openai — gpt-4.1 family
    "gpt-4.1":                      {"input": 2,    "cached_input": 0.5,    "output": 8},
    "gpt-4.1-mini":                 {"input": 0.4,  "cached_input": 0.1,    "output": 1.6},
    "gpt-4.1-nano":                 {"input": 0.1,  "cached_input": 0.025,  "output": 0.4},
    # openai — gpt-4o family
    "gpt-4o":                       {"input": 2.5,  "cached_input": 1.25,   "output": 10},
    "gpt-4o-mini":                  {"input": 0.15, "cached_input": 0.075,  "output": 0.6},
    # openai — o-series
    "o3":                           {"input": 10,   "cached_input": 2.5,    "output": 40},
    "o3-mini":                      {"input": 1.1,  "cached_input": 0.275,  "output": 4.4},
    "o4-mini":                      {"input": 1.1,  "cached_input": 0.275,  "output": 4.4},
    # google — gemini
    "gemini-2.5-pro":               {"input": 1.25, "cached_input": 0.315,  "output": 10},
    "gemini-2.5-flash":             {"input": 0.15, "cached_input": 0.0375, "output": 0.6},
    "gemini-2.0-flash":             {"input": 0.1,  "cached_input": 0.025,  "output": 0.4},
}

FALLBACK_PRICING = {"input": 3, "cached_input": 0.3, "output": 15}


class StatsTracker:
    def __init__(self) -> None:
        self._history: List[RequestStat] = []
        self._max_history = 1000

    def record(self, metrics: CacheMetrics) -> None:
        pricing = PRICING.get(metrics.model, FALLBACK_PRICING)

        uncached_cost = (
            ((metrics.total_input_tokens + metrics.cache_read_tokens) / 1_000_000) * pricing["input"]
            + (metrics.output_tokens / 1_000_000) * pricing["output"]
        )

        actual_cost = (
            (metrics.total_input_tokens / 1_000_000) * pricing["input"]
            + (metrics.cache_read_tokens / 1_000_000) * pricing["cached_input"]
            + (metrics.cache_creation_tokens / 1_000_000) * pricing["input"] * 1.25
            + (metrics.output_tokens / 1_000_000) * pricing["output"]
        )

        savings = max(uncached_cost - actual_cost, 0)

        stat = RequestStat(
            timestamp=time.time(),
            provider=metrics.provider,
            model=metrics.model,
            input_tokens=metrics.total_input_tokens,
            cached_tokens=metrics.cache_read_tokens,
            cache_creation_tokens=metrics.cache_creation_tokens,
            output_tokens=metrics.output_tokens,
            estimated_cost_usd=actual_cost,
            estimated_savings_usd=savings,
        )

        self._history.append(stat)
        if len(self._history) > self._max_history:
            self._history.pop(0)

    def get_stats(self) -> CacheStats:
        total_requests = len(self._history)
        if total_requests == 0:
            return CacheStats()

        cache_hits = 0
        total_input_tokens = 0
        cached_input_tokens = 0
        cache_creation_tokens = 0
        total_savings = 0.0
        total_cost_without = 0.0
        by_model: Dict[str, ModelStats] = {}

        for stat in self._history:
            if stat.cached_tokens > 0:
                cache_hits += 1
            total_input_tokens += stat.input_tokens
            cached_input_tokens += stat.cached_tokens
            cache_creation_tokens += stat.cache_creation_tokens
            total_savings += stat.estimated_savings_usd

            pricing = PRICING.get(stat.model, FALLBACK_PRICING)
            total_cost_without += (
                ((stat.input_tokens + stat.cached_tokens) / 1_000_000) * pricing["input"]
                + (stat.output_tokens / 1_000_000) * pricing["output"]
            )

            if stat.model not in by_model:
                by_model[stat.model] = ModelStats()
            m = by_model[stat.model]
            m.requests += 1
            m.total_input_tokens += stat.input_tokens
            m.cached_input_tokens += stat.cached_tokens
            m.estimated_savings_usd += stat.estimated_savings_usd

        return CacheStats(
            total_requests=total_requests,
            cache_hits=cache_hits,
            cache_misses=total_requests - cache_hits,
            hit_rate=cache_hits / total_requests,
            total_input_tokens=total_input_tokens,
            cached_input_tokens=cached_input_tokens,
            cache_creation_tokens=cache_creation_tokens,
            estimated_savings_usd=_round(total_savings),
            estimated_savings_percent=(
                _round((total_savings / total_cost_without) * 100)
                if total_cost_without > 0
                else 0
            ),
            by_model=by_model,
            history=self._history[-50:],
        )

    def print_stats(self) -> None:
        stats = self.get_stats()

        lines = [
            "",
            "  \033[1mcachellm\033[0m",
            f"  Requests:      {stats.total_requests}",
            f"  Cache hits:    {stats.cache_hits} ({stats.hit_rate * 100:.1f}%)",
            f"  Tokens cached: {_format_number(stats.cached_input_tokens)}",
            f"  Saved:         ${stats.estimated_savings_usd:.2f} ({stats.estimated_savings_percent:.1f}%)",
        ]

        models = list(stats.by_model.items())
        if models:
            lines.append("")
            for model, data in models:
                short = model[:22] + ".." if len(model) > 24 else model
                lines.append(f"  {short}: {data.requests} reqs, ${data.estimated_savings_usd:.2f} saved")

        plain_lines = [_strip_ansi(l) for l in lines]
        box_width = max(len(l) for l in plain_lines) + 2
        top = "\u250c" + "\u2500" * box_width + "\u2510"
        bottom = "\u2514" + "\u2500" * box_width + "\u2518"

        print(top)
        for line, plain in zip(lines, plain_lines):
            padding = box_width - len(plain)
            print("\u2502" + line + " " * padding + "\u2502")
        print(bottom)

    def reset(self) -> None:
        self._history = []


def _round(n: float) -> float:
    return round(n * 100) / 100


def _format_number(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def _strip_ansi(s: str) -> str:
    return re.sub(r"\033\[[0-9;]*m", "", s)

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Literal, Optional

Provider = Literal["anthropic", "openai", "gemini"]
Strategy = Literal["auto", "aggressive", "conservative", "none"]


@dataclass
class CacheOptions:
    enabled: bool = True
    min_tokens: int = 1024
    strategy: Strategy = "auto"
    track_stats: bool = True
    debug: bool = False
    on_optimize: Optional[Callable[["OptimizeEvent"], None]] = None
    token_counter: Optional[Callable[[str], int]] = None


@dataclass
class AnthropicCacheOptions(CacheOptions):
    max_breakpoints: int = 4
    ttl: Literal["5m", "1h"] = "5m"


@dataclass
class OpenAICacheOptions(CacheOptions):
    reorder_system_messages: bool = True


@dataclass
class GeminiCacheOptions(CacheOptions):
    cache_ttl_seconds: int = 600
    max_cache_entries: int = 50


@dataclass
class PromptSegment:
    path: str
    content: str
    token_estimate: int
    stability_score: float
    type: Literal["system", "message", "tool", "document", "image"]


@dataclass
class PromptAnalysis:
    segments: List[PromptSegment]
    stable_segments: List[PromptSegment]
    variable_segments: List[PromptSegment]
    total_tokens: int
    cacheable_tokens: int
    estimated_savings_percent: int


@dataclass
class BreakpointSuggestion:
    path: str
    token_count: int
    reason: str


@dataclass
class OptimizeEvent:
    provider: Provider
    breakpoints_placed: int
    estimated_cacheable_tokens: int
    segments_analyzed: int
    duration_ms: float


@dataclass
class RequestStat:
    timestamp: float
    provider: Provider
    model: str
    input_tokens: int
    cached_tokens: int
    cache_creation_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    estimated_savings_usd: float


@dataclass
class ModelStats:
    requests: int = 0
    total_input_tokens: int = 0
    cached_input_tokens: int = 0
    estimated_savings_usd: float = 0.0


@dataclass
class CacheStats:
    total_requests: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    hit_rate: float = 0.0
    total_input_tokens: int = 0
    cached_input_tokens: int = 0
    cache_creation_tokens: int = 0
    estimated_savings_usd: float = 0.0
    estimated_savings_percent: float = 0.0
    by_model: Dict[str, ModelStats] = field(default_factory=dict)
    history: List[RequestStat] = field(default_factory=list)


@dataclass
class CacheMetrics:
    cache_creation_tokens: int
    cache_read_tokens: int
    total_input_tokens: int
    output_tokens: int
    model: str
    provider: Provider

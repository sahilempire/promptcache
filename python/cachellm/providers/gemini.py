from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional

from cachellm.types import CacheMetrics, CacheStats, GeminiCacheOptions
from cachellm.core.token_estimator import estimate_tokens
from cachellm.core.hasher import hash_content
from cachellm.utils.lru import LRU
from cachellm.stats.tracker import StatsTracker
from cachellm.utils.logger import create_logger


class _CacheEntry:
    def __init__(self, name: str, content_hash: str, created_at: float, ttl_seconds: int):
        self.name = name
        self.content_hash = content_hash
        self.created_at = created_at
        self.ttl_seconds = ttl_seconds


class _GeminiModelProxy:
    def __init__(self, get_model: Any, tracker: StatsTracker, model_name: str, should_cache: bool, track_stats: bool):
        self._get_model = get_model
        self._tracker = tracker
        self._model_name = model_name
        self._should_cache = should_cache
        self._track_stats = track_stats

    def generate_content(self, *args: Any, **kwargs: Any) -> Any:
        model = self._get_model()
        result = model.generate_content(*args, **kwargs)

        if self._track_stats:
            self._tracker.record(_extract_gemini_metrics(result, self._model_name, self._should_cache))

        return result

    def generate_content_stream(self, *args: Any, **kwargs: Any) -> Any:
        model = self._get_model()
        return model.generate_content_stream(*args, **kwargs)

    def get_base_model(self) -> Any:
        return self._get_model()


def optimize_gemini(
    gen_ai: Any,
    cache_manager: Any,
    config: Dict[str, Any],
    options: Optional[GeminiCacheOptions] = None,
) -> Dict[str, Any]:
    opts_obj = options or GeminiCacheOptions()
    model_name = config["model"]
    system_instruction = config.get("system_instruction")
    tools = config.get("tools")

    min_tokens = opts_obj.min_tokens if opts_obj.min_tokens != 1024 else 32768
    cache_ttl = opts_obj.cache_ttl_seconds
    max_entries = opts_obj.max_cache_entries
    track_stats = opts_obj.track_stats
    debug = opts_obj.debug
    token_counter = opts_obj.token_counter or estimate_tokens

    log = create_logger(debug)
    tracker = StatsTracker()
    cache_store: LRU[str, _CacheEntry] = LRU(max_entries)

    static_content = _build_static_content(system_instruction, tools)
    static_tokens = token_counter(static_content)
    content_hash = hash_content(static_content)
    should_cache = static_tokens >= min_tokens and opts_obj.enabled

    log.debug(f"static content: {static_tokens} tokens, cache: {'yes' if should_cache else 'no (below 32K minimum)'}")

    def get_model() -> Any:
        if not should_cache:
            return gen_ai.getGenerativeModel(
                model=model_name,
                system_instruction=system_instruction,
                tools=tools,
            )

        existing = cache_store.get(content_hash)
        if existing and not _is_expired(existing):
            log.debug(f"cache hit: {existing.name}")
            try:
                cached = cache_manager.get(existing.name)
                get_from_cached = getattr(gen_ai, "getGenerativeModelFromCachedContent", None)
                if get_from_cached:
                    return get_from_cached(cached)
                return gen_ai.getGenerativeModel(model=model_name, cached_content=cached)
            except Exception:
                log.debug("cached content expired server-side, recreating")

        log.debug("creating new cached content")
        try:
            cached = cache_manager.create(
                model=model_name,
                system_instruction=system_instruction,
                contents=[{"role": "user", "parts": [{"text": static_content}]}],
                ttl_seconds=cache_ttl,
                tools=tools,
            )

            name = getattr(cached, "name", None) or cached.get("name", f"cache-{int(time.time())}")
            cache_store.set(content_hash, _CacheEntry(
                name=name,
                content_hash=content_hash,
                created_at=time.time(),
                ttl_seconds=cache_ttl,
            ))

            log.debug(f"cache created: {name}")

            get_from_cached = getattr(gen_ai, "getGenerativeModelFromCachedContent", None)
            if get_from_cached:
                return get_from_cached(cached)
            return gen_ai.getGenerativeModel(model=model_name, cached_content=cached)
        except Exception:
            log.warn("failed to create cache, falling back to uncached model")
            return gen_ai.getGenerativeModel(
                model=model_name,
                system_instruction=system_instruction,
                tools=tools,
            )

    model_proxy = _GeminiModelProxy(get_model, tracker, model_name, should_cache, track_stats)

    def clear_cache() -> None:
        cache_store.clear()
        log.debug("cache store cleared")

    return {
        "model": model_proxy,
        "stats": lambda: tracker.get_stats(),
        "print_stats": lambda: tracker.print_stats(),
        "reset_stats": lambda: tracker.reset(),
        "clear_cache": clear_cache,
    }


def _build_static_content(system_instruction: Optional[str], tools: Optional[List[Any]]) -> str:
    parts: List[str] = []
    if system_instruction:
        parts.append(system_instruction)
    if tools and len(tools) > 0:
        parts.append(json.dumps(tools))
    return "\n\n".join(parts)


def _is_expired(entry: _CacheEntry) -> bool:
    elapsed = time.time() - entry.created_at
    return elapsed > entry.ttl_seconds * 0.9


def _extract_gemini_metrics(result: Any, model: str, was_cached: bool) -> CacheMetrics:
    response = getattr(result, "response", result)
    usage = getattr(response, "usage_metadata", None)

    if usage is None:
        return CacheMetrics(0, 0, 0, 0, model, "gemini")

    return CacheMetrics(
        cache_creation_tokens=0 if was_cached else (getattr(usage, "prompt_token_count", 0) or 0),
        cache_read_tokens=getattr(usage, "cached_content_token_count", 0) or 0,
        total_input_tokens=getattr(usage, "prompt_token_count", 0) or 0,
        output_tokens=getattr(usage, "candidates_token_count", 0) or 0,
        model=model,
        provider="gemini",
    )

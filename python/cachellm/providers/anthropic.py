from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional

from cachellm.types import AnthropicCacheOptions, CacheMetrics, CacheStats, OptimizeEvent
from cachellm.core.analyzer import PromptAnalyzer
from cachellm.core.strategy import select_breakpoints
from cachellm.core.differ import ContentDiffer
from cachellm.stats.tracker import StatsTracker
from cachellm.utils.logger import create_logger


class _OptimizedMessages:
    def __init__(self, messages: Any, analyzer: PromptAnalyzer, opts: Dict[str, Any], log: Any, tracker: StatsTracker):
        self._messages = messages
        self._analyzer = analyzer
        self._opts = opts
        self._log = log
        self._tracker = tracker

    def create(self, **kwargs: Any) -> Any:
        if not self._opts["enabled"]:
            return self._messages.create(**kwargs)

        start = time.time()
        optimized = _optimize_params(kwargs, self._analyzer, self._opts, self._log)
        duration_ms = (time.time() - start) * 1000

        if self._opts.get("on_optimize"):
            self._opts["on_optimize"](OptimizeEvent(
                provider="anthropic",
                breakpoints_placed=_count_breakpoints(optimized),
                estimated_cacheable_tokens=0,
                segments_analyzed=0,
                duration_ms=duration_ms,
            ))

        response = self._messages.create(**optimized)

        if self._opts["track_stats"]:
            self._tracker.record(_extract_metrics(response))

        return response

    def stream(self, **kwargs: Any) -> Any:
        if not self._opts["enabled"]:
            return self._messages.stream(**kwargs)

        optimized = _optimize_params(kwargs, self._analyzer, self._opts, self._log)
        stream = self._messages.stream(**optimized)

        if not self._opts["track_stats"]:
            return stream

        return _WrappedStream(stream, self._tracker, kwargs.get("model", "unknown"))

    def __getattr__(self, name: str) -> Any:
        return getattr(self._messages, name)


class _WrappedStream:
    """Wraps an Anthropic MessageStream to capture usage metrics."""

    def __init__(self, stream: Any, tracker: StatsTracker, model: str):
        self._stream = stream
        self._tracker = tracker
        self._model = model

    def get_final_message(self) -> Any:
        msg = self._stream.get_final_message()
        if hasattr(msg, "usage") and msg.usage:
            self._tracker.record(_extract_metrics(msg))
        return msg

    def __iter__(self) -> Any:
        for event in self._stream:
            if hasattr(event, "type") and event.type == "message_delta":
                usage = getattr(event, "usage", None)
                if usage:
                    cache_creation = getattr(usage, "cache_creation_input_tokens", 0) or 0
                    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
                    if cache_creation or cache_read:
                        self._tracker.record(CacheMetrics(
                            cache_creation_tokens=cache_creation,
                            cache_read_tokens=cache_read,
                            total_input_tokens=getattr(usage, "input_tokens", 0) or 0,
                            output_tokens=getattr(usage, "output_tokens", 0) or 0,
                            model=self._model,
                            provider="anthropic",
                        ))
            yield event

    def __enter__(self) -> _WrappedStream:
        if hasattr(self._stream, "__enter__"):
            self._stream.__enter__()
        return self

    def __exit__(self, *args: Any) -> None:
        if hasattr(self._stream, "__exit__"):
            self._stream.__exit__(*args)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._stream, name)


class OptimizedAnthropic:
    def __init__(self, client: Any, opts: Dict[str, Any], analyzer: PromptAnalyzer, tracker: StatsTracker, log: Any):
        self._client = client
        self._opts = opts
        self._tracker = tracker
        self._messages_proxy = _OptimizedMessages(client.messages, analyzer, opts, log, tracker)

    @property
    def messages(self) -> _OptimizedMessages:
        return self._messages_proxy

    def stats(self) -> CacheStats:
        return self._tracker.get_stats()

    def print_stats(self) -> None:
        self._tracker.print_stats()

    def reset_stats(self) -> None:
        self._tracker.reset()

    def __getattr__(self, name: str) -> Any:
        return getattr(self._client, name)


def optimize_anthropic(client: Any, options: Optional[AnthropicCacheOptions] = None) -> OptimizedAnthropic:
    opts_obj = options or AnthropicCacheOptions()
    opts: Dict[str, Any] = {
        "enabled": opts_obj.enabled,
        "min_tokens": opts_obj.min_tokens,
        "strategy": opts_obj.strategy,
        "max_breakpoints": opts_obj.max_breakpoints,
        "ttl": opts_obj.ttl,
        "track_stats": opts_obj.track_stats,
        "debug": opts_obj.debug,
        "on_optimize": opts_obj.on_optimize,
    }

    log = create_logger(opts["debug"])
    differ = ContentDiffer()
    analyzer = PromptAnalyzer(differ, opts_obj.token_counter)
    tracker = StatsTracker()

    log.debug("initialized with options:", {
        "strategy": opts["strategy"],
        "max_breakpoints": opts["max_breakpoints"],
        "min_tokens": opts["min_tokens"],
    })

    return OptimizedAnthropic(client, opts, analyzer, tracker, log)


def _optimize_params(
    params: Dict[str, Any],
    analyzer: PromptAnalyzer,
    opts: Dict[str, Any],
    log: Any,
) -> Dict[str, Any]:
    optimized = dict(params)

    analysis = analyzer.analyze_anthropic_params(params)
    breakpoints = select_breakpoints(
        analysis.segments,
        max_breakpoints=opts["max_breakpoints"],
        min_tokens=opts["min_tokens"],
        strategy=opts["strategy"],
    )

    if not breakpoints:
        log.debug("no segments eligible for caching")
        return optimized

    log.debug(f"placing {len(breakpoints)} breakpoints:", [b.path for b in breakpoints])

    # inject cache_control into system prompt
    system_bp = next((b for b in breakpoints if b.path.startswith("system")), None)
    if system_bp and "system" in optimized:
        optimized["system"] = _inject_system_cache(optimized["system"], opts["ttl"])

    # inject cache_control into tools
    tools_bp = next((b for b in breakpoints if b.path == "tools"), None)
    if tools_bp and "tools" in optimized:
        tools = list(optimized["tools"])
        if tools:
            last = dict(tools[-1])
            last["cache_control"] = {"type": "ephemeral"}
            tools[-1] = last
            optimized["tools"] = tools

    # inject cache_control into messages
    msg_bps = [b for b in breakpoints if b.path.startswith("messages")]
    if msg_bps and "messages" in optimized:
        messages = list(optimized["messages"])
        for bp in msg_bps:
            import re
            match = re.match(r"messages\[(\d+)\]", bp.path)
            if match:
                idx = int(match.group(1))
                if idx < len(messages):
                    messages[idx] = _inject_message_cache(messages[idx])
        optimized["messages"] = messages

    return optimized


def _inject_system_cache(system: Any, ttl: str) -> List[Dict[str, Any]]:
    cache_control = {"type": "ephemeral"}

    if isinstance(system, str):
        return [{"type": "text", "text": system, "cache_control": cache_control}]

    if isinstance(system, list) and len(system) > 0:
        blocks = list(system)
        last = dict(blocks[-1])
        last["cache_control"] = cache_control
        blocks[-1] = last
        return blocks

    return system


def _inject_message_cache(msg: Dict[str, Any]) -> Dict[str, Any]:
    updated = dict(msg)
    content = updated.get("content")

    if isinstance(content, str):
        updated["content"] = [{"type": "text", "text": content, "cache_control": {"type": "ephemeral"}}]
    elif isinstance(content, list) and len(content) > 0:
        blocks = list(content)
        last = dict(blocks[-1])
        last["cache_control"] = {"type": "ephemeral"}
        blocks[-1] = last
        updated["content"] = blocks

    return updated


def _count_breakpoints(params: Dict[str, Any]) -> int:
    text = json.dumps(params, default=str)
    return text.count("cache_control")


def _extract_metrics(response: Any) -> CacheMetrics:
    usage = getattr(response, "usage", None) or {}
    if isinstance(usage, dict):
        return CacheMetrics(
            cache_creation_tokens=usage.get("cache_creation_input_tokens", 0) or 0,
            cache_read_tokens=usage.get("cache_read_input_tokens", 0) or 0,
            total_input_tokens=usage.get("input_tokens", 0) or 0,
            output_tokens=usage.get("output_tokens", 0) or 0,
            model=getattr(response, "model", "unknown"),
            provider="anthropic",
        )
    return CacheMetrics(
        cache_creation_tokens=getattr(usage, "cache_creation_input_tokens", 0) or 0,
        cache_read_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
        total_input_tokens=getattr(usage, "input_tokens", 0) or 0,
        output_tokens=getattr(usage, "output_tokens", 0) or 0,
        model=getattr(response, "model", "unknown"),
        provider="anthropic",
    )

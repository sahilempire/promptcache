from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from cachellm.types import CacheMetrics, CacheStats, OpenAICacheOptions
from cachellm.stats.tracker import StatsTracker
from cachellm.utils.logger import create_logger


class _OptimizedCompletions:
    def __init__(self, completions: Any, opts: Dict[str, Any], log: Any, tracker: StatsTracker):
        self._completions = completions
        self._opts = opts
        self._log = log
        self._tracker = tracker

    def create(self, **kwargs: Any) -> Any:
        if not self._opts["enabled"]:
            return self._completions.create(**kwargs)

        if self._opts["reorder_system_messages"]:
            kwargs = _reorder_for_prefix_match(kwargs, self._log)

        response = self._completions.create(**kwargs)

        if self._opts["track_stats"]:
            self._tracker.record(_extract_metrics(response))

        return response

    def __getattr__(self, name: str) -> Any:
        return getattr(self._completions, name)


class _OptimizedChat:
    def __init__(self, chat: Any, opts: Dict[str, Any], log: Any, tracker: StatsTracker):
        self._chat = chat
        self._completions_proxy = _OptimizedCompletions(chat.completions, opts, log, tracker)

    @property
    def completions(self) -> _OptimizedCompletions:
        return self._completions_proxy

    def __getattr__(self, name: str) -> Any:
        return getattr(self._chat, name)


class OptimizedOpenAI:
    def __init__(self, client: Any, opts: Dict[str, Any], tracker: StatsTracker, log: Any):
        self._client = client
        self._tracker = tracker
        self._chat_proxy = _OptimizedChat(client.chat, opts, log, tracker)

    @property
    def chat(self) -> _OptimizedChat:
        return self._chat_proxy

    def stats(self) -> CacheStats:
        return self._tracker.get_stats()

    def print_stats(self) -> None:
        self._tracker.print_stats()

    def reset_stats(self) -> None:
        self._tracker.reset()

    def __getattr__(self, name: str) -> Any:
        return getattr(self._client, name)


def optimize_openai(client: Any, options: Optional[OpenAICacheOptions] = None) -> OptimizedOpenAI:
    opts_obj = options or OpenAICacheOptions()
    opts: Dict[str, Any] = {
        "enabled": opts_obj.enabled,
        "min_tokens": opts_obj.min_tokens,
        "strategy": opts_obj.strategy,
        "reorder_system_messages": opts_obj.reorder_system_messages,
        "track_stats": opts_obj.track_stats,
        "debug": opts_obj.debug,
    }

    log = create_logger(opts["debug"])
    tracker = StatsTracker()

    log.debug("initialized for openai")

    return OptimizedOpenAI(client, opts, tracker, log)


def _reorder_for_prefix_match(params: Dict[str, Any], log: Any) -> Dict[str, Any]:
    """Reorder messages so static system instructions come first,
    followed by stable content, with variable user input at the end."""
    messages = params.get("messages")
    if not messages or len(messages) <= 1:
        return params

    system_msgs = [m for m in messages if m.get("role") == "system"]
    non_system_msgs = [m for m in messages if m.get("role") != "system"]

    if len(system_msgs) <= 1:
        return params

    def content_len(m: Dict[str, Any]) -> int:
        c = m.get("content", "")
        return len(c) if isinstance(c, str) else len(json.dumps(c))

    sorted_system = sorted(system_msgs, key=content_len, reverse=True)

    log.debug(f"reordered {len(system_msgs)} system messages for prefix optimization")

    return {**params, "messages": sorted_system + non_system_msgs}


def _extract_metrics(response: Any) -> CacheMetrics:
    usage = getattr(response, "usage", None)
    if usage is None:
        return CacheMetrics(0, 0, 0, 0, "unknown", "openai")

    details = getattr(usage, "prompt_tokens_details", None)
    cached = 0
    if details:
        cached = getattr(details, "cached_tokens", 0) or 0

    return CacheMetrics(
        cache_creation_tokens=0,
        cache_read_tokens=cached,
        total_input_tokens=getattr(usage, "prompt_tokens", 0) or 0,
        output_tokens=getattr(usage, "completion_tokens", 0) or 0,
        model=getattr(response, "model", "unknown"),
        provider="openai",
    )

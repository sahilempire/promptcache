from __future__ import annotations

import json
from typing import Any, Callable, Dict, List, Optional

from cachellm.types import PromptAnalysis, PromptSegment
from cachellm.core.token_estimator import estimate_tokens, estimate_tokens_for_object
from cachellm.core.differ import ContentDiffer


class PromptAnalyzer:
    """The heart of cachellm. Analyzes a prompt to identify which parts
    are worth caching and where to place breakpoints.

    Scoring is based on:
    - Position: system prompts and tools are almost always static
    - Size: bigger blocks save more money when cached
    - Repetition: if we've seen it before, it's definitely stable
    - Content patterns: XML tags, JSON schemas, large text = likely static
    """

    def __init__(
        self,
        differ: Optional[ContentDiffer] = None,
        token_counter: Optional[Callable[[str], int]] = None,
    ):
        self._differ = differ or ContentDiffer()
        self._token_counter = token_counter or estimate_tokens

    def analyze_anthropic_params(self, params: Dict[str, Any]) -> PromptAnalysis:
        segments: List[PromptSegment] = []

        # analyze system prompt
        system = params.get("system")
        if system:
            if isinstance(system, str):
                tokens = self._token_counter(system)
                repetitions = self._differ.record_and_count(system)
                segments.append(PromptSegment(
                    path="system",
                    content=system[:200],
                    token_estimate=tokens,
                    stability_score=self._score_stability("system", repetitions, system),
                    type="system",
                ))
            elif isinstance(system, list):
                for i, block in enumerate(system):
                    if block.get("type") == "text" and block.get("text"):
                        text = block["text"]
                        tokens = self._token_counter(text)
                        repetitions = self._differ.record_and_count(text)
                        segments.append(PromptSegment(
                            path=f"system[{i}]",
                            content=text[:200],
                            token_estimate=tokens,
                            stability_score=self._score_stability("system", repetitions, text),
                            type="system",
                        ))

        # analyze tools
        tools = params.get("tools")
        if tools and len(tools) > 0:
            tokens = estimate_tokens_for_object(tools)
            repetitions = self._differ.record_object_and_count(tools)
            segments.append(PromptSegment(
                path="tools",
                content=f"{len(tools)} tool definitions",
                token_estimate=tokens,
                stability_score=self._score_stability("tool", repetitions),
                type="tool",
            ))

        # analyze messages
        messages = params.get("messages")
        if messages:
            total_messages = len(messages)
            for i, msg in enumerate(messages):
                content = msg.get("content", "")
                text = content if isinstance(content, str) else json.dumps(content)
                tokens = self._token_counter(text)

                position_from_end = total_messages - i
                repetitions = self._differ.record_and_count(text)

                if position_from_end <= 1:
                    base_score = 0.1
                elif position_from_end <= 3:
                    base_score = 0.3
                else:
                    base_score = 0.7

                segments.append(PromptSegment(
                    path=f"messages[{i}]",
                    content=text[:200],
                    token_estimate=tokens,
                    stability_score=self._score_stability("message", repetitions, text, base_score),
                    type="message",
                ))

        stable_segments = [s for s in segments if s.stability_score >= 0.6]
        variable_segments = [s for s in segments if s.stability_score < 0.6]
        total_tokens = sum(s.token_estimate for s in segments)
        cacheable_tokens = sum(s.token_estimate for s in stable_segments)

        return PromptAnalysis(
            segments=segments,
            stable_segments=stable_segments,
            variable_segments=variable_segments,
            total_tokens=total_tokens,
            cacheable_tokens=cacheable_tokens,
            estimated_savings_percent=(
                round((cacheable_tokens / total_tokens) * 90)
                if total_tokens > 0
                else 0
            ),
        )

    def _score_stability(
        self,
        type: str,
        repetitions: int,
        content: Optional[str] = None,
        base_score: Optional[float] = None,
    ) -> float:
        score = base_score if base_score is not None else 0.5

        # structural position matters a lot
        if type == "system":
            score = max(score, 0.9)
        if type == "tool":
            score = max(score, 0.9)

        # seen before? that's a strong signal
        if repetitions >= 3:
            score = max(score, 0.95)
        elif repetitions >= 2:
            score = max(score, 0.85)

        # content heuristics
        if content:
            if "<instructions>" in content or "<context>" in content or "<rules>" in content:
                score = max(score, 0.85)
            if len(content) > 5000:
                score = max(score, 0.8)
            if '"type"' in content and '"properties"' in content:
                score = max(score, 0.85)

        return min(score, 1.0)

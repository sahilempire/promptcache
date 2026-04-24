from __future__ import annotations

from typing import List

from cachellm.types import BreakpointSuggestion, PromptSegment, Strategy


def select_breakpoints(
    segments: List[PromptSegment],
    *,
    max_breakpoints: int,
    min_tokens: int,
    strategy: Strategy,
) -> List[BreakpointSuggestion]:
    """Given analyzed segments, decide where to place cache breakpoints.

    For Anthropic, we get up to 4 breakpoints. We want to place them
    to maximize the total cached tokens while respecting the minimum
    token threshold.

    The algorithm is greedy: sort by (stability * tokens) descending,
    pick the top N that meet the minimum.
    """
    if strategy == "none":
        return []

    def is_eligible(s: PromptSegment) -> bool:
        if s.token_estimate < min_tokens:
            return False
        if strategy == "aggressive":
            return s.stability_score >= 0.4
        elif strategy == "conservative":
            return s.stability_score >= 0.85
        else:  # auto
            return s.stability_score >= 0.6

    eligible = [s for s in segments if is_eligible(s)]

    scored = sorted(
        eligible,
        key=lambda s: s.stability_score * s.token_estimate,
        reverse=True,
    )

    selected = scored[:max_breakpoints]

    return [
        BreakpointSuggestion(
            path=s.path,
            token_count=s.token_estimate,
            reason=_build_reason(s),
        )
        for s in selected
    ]


def _build_reason(segment: PromptSegment) -> str:
    parts: list[str] = []

    if segment.type == "system":
        parts.append("system prompt")
    elif segment.type == "tool":
        parts.append("tool definitions")
    elif segment.type == "document":
        parts.append("document content")
    else:
        parts.append(f"{segment.type} content")

    parts.append(f"(~{segment.token_estimate} tokens)")

    if segment.stability_score >= 0.9:
        parts.append("— highly stable")
    elif segment.stability_score >= 0.7:
        parts.append("— stable")

    return " ".join(parts)


def estimate_savings(
    breakpoints: List[BreakpointSuggestion],
    total_input_tokens: int,
    price_per_million_input: float,
) -> dict:
    """Estimate how much money you'd save with these breakpoints."""
    cached_tokens = sum(bp.token_count for bp in breakpoints)

    # cached tokens cost 10% of normal (90% savings)
    normal_cost = (cached_tokens / 1_000_000) * price_per_million_input
    cached_cost = (cached_tokens / 1_000_000) * price_per_million_input * 0.1
    saved_per_request = normal_cost - cached_cost

    return {"saved_per_request": saved_per_request, "cached_tokens": cached_tokens}

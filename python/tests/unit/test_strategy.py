from cachellm.core.strategy import select_breakpoints, estimate_savings
from cachellm.types import PromptSegment


def _seg(path, tokens, stability, type="system"):
    return PromptSegment(path=path, content="test", token_estimate=tokens, stability_score=stability, type=type)


def test_selects_above_min_tokens():
    segments = [_seg("system", 2000, 0.95), _seg("tools", 500, 0.95), _seg("messages[0]", 1500, 0.8)]
    bps = select_breakpoints(segments, max_breakpoints=4, min_tokens=1024, strategy="auto")
    assert len(bps) == 2
    assert not any(b.path == "tools" for b in bps)


def test_respects_max_breakpoints():
    segments = [_seg("system", 2000, 0.95), _seg("tools", 3000, 0.95, "tool"), _seg("messages[0]", 1500, 0.8, "message"), _seg("messages[1]", 1200, 0.75, "message")]
    bps = select_breakpoints(segments, max_breakpoints=2, min_tokens=1024, strategy="auto")
    assert len(bps) == 2
    assert bps[0].path == "tools"
    assert bps[1].path == "system"


def test_strategy_none():
    segments = [_seg("system", 5000, 0.99)]
    bps = select_breakpoints(segments, max_breakpoints=4, min_tokens=1024, strategy="none")
    assert len(bps) == 0


def test_conservative():
    segments = [_seg("system", 2000, 0.95), _seg("messages[0]", 2000, 0.7, "message")]
    bps = select_breakpoints(segments, max_breakpoints=4, min_tokens=1024, strategy="conservative")
    assert len(bps) == 1
    assert bps[0].path == "system"


def test_aggressive():
    segments = [_seg("system", 2000, 0.95), _seg("messages[2]", 2000, 0.5, "message")]
    bps = select_breakpoints(segments, max_breakpoints=4, min_tokens=1024, strategy="aggressive")
    assert len(bps) == 2


def test_estimate_savings():
    breakpoints = [PromptSegment(path="system", content="", token_estimate=5000, stability_score=0.95, type="system")]
    from cachellm.types import BreakpointSuggestion
    bps = [BreakpointSuggestion(path="system", token_count=5000, reason="system prompt")]
    result = estimate_savings(bps, 6000, 3.0)
    assert result["cached_tokens"] == 5000
    assert result["saved_per_request"] > 0
    assert abs(result["saved_per_request"] - 0.0135) < 0.001

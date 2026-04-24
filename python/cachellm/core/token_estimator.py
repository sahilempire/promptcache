import json
import math
import re


def estimate_tokens(text: str) -> int:
    """Fast token estimation without tiktoken dependency.

    tiktoken adds ~3MB of WASM to your bundle. For deciding where to place
    cache breakpoints, we don't need exact counts — being within ~15% is
    plenty good enough. If you need precision, pass a custom token_counter.

    Based on OpenAI's own rule of thumb: ~4 chars per token for English.
    We adjust for code (more tokens per char) and CJK (fewer chars per token).
    """
    if not text:
        return 0

    char_count = len(text)
    non_ascii_count = sum(1 for ch in text if ord(ch) > 127)

    # base estimate: ~4 chars per token
    estimate = char_count / 4

    # CJK and non-ASCII heavy text uses more tokens per char
    non_ascii_ratio = non_ascii_count / char_count if char_count else 0
    if non_ascii_ratio > 0.3:
        estimate = char_count / 2.5

    # code tends to be more token-dense (lots of special chars, short identifiers)
    code_indicators = len(re.findall(r"[{}()\[\];=<>]", text))
    if char_count and code_indicators / char_count > 0.05:
        estimate *= 1.15

    return math.ceil(estimate)


def estimate_tokens_for_object(obj: object) -> int:
    """Estimate tokens for a structured object (tool definitions, message arrays, etc.)
    by serializing to JSON first."""
    return estimate_tokens(json.dumps(obj))

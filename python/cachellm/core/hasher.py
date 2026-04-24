import json
import re


def hash_content(content: str) -> str:
    """Content fingerprinting using djb2 hash.
    Not cryptographic — just collision-resistant identity checks for prompt content."""
    h = 5381
    for ch in content:
        h = ((h << 5) + h + ord(ch)) & 0xFFFFFFFF
    return _base36(h)


def hash_object(obj: object) -> str:
    return hash_content(json.dumps(obj, sort_keys=True))


def hash_normalized(content: str) -> str:
    """Hash content with normalized whitespace so minor formatting
    changes don't invalidate the cache."""
    normalized = re.sub(r"\s+", " ", content).strip()
    return hash_content(normalized)


def _base36(n: int) -> str:
    if n == 0:
        return "0"
    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    result = []
    while n:
        n, remainder = divmod(n, 36)
        result.append(chars[remainder])
    return "".join(reversed(result))

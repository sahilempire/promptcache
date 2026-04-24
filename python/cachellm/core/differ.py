from cachellm.utils.lru import LRU
from cachellm.core.hasher import hash_normalized, hash_object


class ContentDiffer:
    """Tracks content hashes across requests to figure out what's stable
    (same every call) vs what changes (user query, conversation tail).

    The idea: if a content block appears in 2+ of your last N requests,
    it's almost certainly stable and worth caching.
    """

    def __init__(self, window_size: int = 100, stability_threshold: int = 2):
        self._seen: LRU[str, int] = LRU(window_size)
        self._threshold = stability_threshold

    def record_and_count(self, content: str) -> int:
        """Record a content block and return how many times we've seen it."""
        h = hash_normalized(content)
        count = (self._seen.get(h) or 0) + 1
        self._seen.set(h, count)
        return count

    def record_object_and_count(self, obj: object) -> int:
        h = hash_object(obj)
        count = (self._seen.get(h) or 0) + 1
        self._seen.set(h, count)
        return count

    def is_stable(self, content: str) -> bool:
        """Check if we've seen this content enough times to consider it stable."""
        h = hash_normalized(content)
        return (self._seen.get(h) or 0) >= self._threshold

    def is_object_stable(self, obj: object) -> bool:
        h = hash_object(obj)
        return (self._seen.get(h) or 0) >= self._threshold

    def clear(self) -> None:
        self._seen.clear()

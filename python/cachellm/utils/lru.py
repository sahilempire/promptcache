from collections import OrderedDict
from typing import Generic, Optional, TypeVar

K = TypeVar("K")
V = TypeVar("V")


class LRU(Generic[K, V]):
    """Simple LRU cache. Nothing fancy, just enough for tracking
    content hashes across requests without leaking memory."""

    def __init__(self, max_size: int = 100):
        self._dict: OrderedDict[K, V] = OrderedDict()
        self._max_size = max_size

    def get(self, key: K) -> Optional[V]:
        if key not in self._dict:
            return None
        self._dict.move_to_end(key)
        return self._dict[key]

    def set(self, key: K, value: V) -> None:
        if key in self._dict:
            del self._dict[key]
        elif len(self._dict) >= self._max_size:
            self._dict.popitem(last=False)
        self._dict[key] = value

    def has(self, key: K) -> bool:
        return key in self._dict

    @property
    def size(self) -> int:
        return len(self._dict)

    def clear(self) -> None:
        self._dict.clear()

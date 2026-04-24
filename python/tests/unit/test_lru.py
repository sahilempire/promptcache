from cachellm.utils.lru import LRU


def test_stores_and_retrieves():
    cache = LRU(10)
    cache.set("a", 1)
    cache.set("b", 2)
    assert cache.get("a") == 1
    assert cache.get("b") == 2


def test_returns_none_for_missing():
    cache = LRU(10)
    assert cache.get("missing") is None


def test_evicts_oldest():
    cache = LRU(3)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    cache.set("d", 4)
    assert cache.get("a") is None
    assert cache.get("b") == 2
    assert cache.get("d") == 4
    assert cache.size == 3


def test_access_refreshes_position():
    cache = LRU(3)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    cache.get("a")  # refresh
    cache.set("d", 4)  # evicts b, not a
    assert cache.get("a") == 1
    assert cache.get("b") is None


def test_update_without_growing():
    cache = LRU(3)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("a", 10)
    assert cache.get("a") == 10
    assert cache.size == 2


def test_clear():
    cache = LRU(10)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.clear()
    assert cache.size == 0
    assert cache.get("a") is None

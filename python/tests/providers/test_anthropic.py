from unittest.mock import MagicMock
from cachellm.providers.anthropic import optimize_anthropic
from cachellm.types import AnthropicCacheOptions


def _mock_client(**usage_overrides):
    usage = {
        "input_tokens": 150,
        "output_tokens": 42,
        "cache_creation_input_tokens": 80,
        "cache_read_input_tokens": 0,
        **usage_overrides,
    }
    response = MagicMock()
    response.model = "claude-sonnet-4-20250514"
    response.usage = MagicMock()
    for k, v in usage.items():
        setattr(response.usage, k, v)

    client = MagicMock()
    client.messages.create = MagicMock(return_value=response)
    return client, response


def test_exposes_stats_methods():
    client, _ = _mock_client()
    wrapped = optimize_anthropic(client)
    assert callable(wrapped.stats)
    assert callable(wrapped.print_stats)
    assert callable(wrapped.reset_stats)


def test_calls_create():
    client, _ = _mock_client()
    wrapped = optimize_anthropic(client)
    res = wrapped.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        system="You are a helpful assistant.",
        messages=[{"role": "user", "content": "Hello"}],
    )
    client.messages.create.assert_called_once()


def test_injects_cache_control_system():
    client, _ = _mock_client()
    wrapped = optimize_anthropic(client, AnthropicCacheOptions(min_tokens=10))
    wrapped.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        system="You are an expert chef. You know every recipe from every country.",
        messages=[{"role": "user", "content": "How do I poach an egg?"}],
    )
    call_kwargs = client.messages.create.call_args[1]
    system = call_kwargs["system"]
    assert isinstance(system, list)
    assert system[-1]["cache_control"] == {"type": "ephemeral"}


def test_injects_cache_control_tools():
    client, _ = _mock_client()
    wrapped = optimize_anthropic(client, AnthropicCacheOptions(min_tokens=10))
    wrapped.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        system="You help users check the weather.",
        tools=[
            {"name": "get_weather", "description": "Get weather", "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}},
            {"name": "get_forecast", "description": "Get forecast", "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}},
        ],
        messages=[{"role": "user", "content": "Will it rain?"}],
    )
    call_kwargs = client.messages.create.call_args[1]
    tools = call_kwargs["tools"]
    assert tools[-1]["cache_control"] == {"type": "ephemeral"}
    assert "cache_control" not in tools[0]


def test_tracks_cache_creation():
    client, _ = _mock_client()
    wrapped = optimize_anthropic(client)
    wrapped.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        system="test",
        messages=[{"role": "user", "content": "test"}],
    )
    stats = wrapped.stats()
    assert stats.total_requests == 1
    assert stats.cache_creation_tokens == 80
    assert stats.cached_input_tokens == 0


def test_tracks_cache_reads():
    client, resp1 = _mock_client()

    resp2 = MagicMock()
    resp2.model = "claude-sonnet-4-20250514"
    resp2.usage = MagicMock()
    resp2.usage.input_tokens = 30
    resp2.usage.output_tokens = 15
    resp2.usage.cache_creation_input_tokens = 0
    resp2.usage.cache_read_input_tokens = 80

    client.messages.create = MagicMock(side_effect=[resp1, resp2])
    wrapped = optimize_anthropic(client)

    wrapped.messages.create(model="claude-sonnet-4-20250514", max_tokens=100, system="Be helpful.", messages=[{"role": "user", "content": "Hi"}])
    wrapped.messages.create(model="claude-sonnet-4-20250514", max_tokens=100, system="Be helpful.", messages=[{"role": "user", "content": "Hi again"}])

    stats = wrapped.stats()
    assert stats.total_requests == 2
    assert stats.cache_hits == 1
    assert stats.cache_misses == 1
    assert stats.cached_input_tokens == 80


def test_reset_stats():
    client, _ = _mock_client()
    wrapped = optimize_anthropic(client)
    wrapped.messages.create(model="claude-sonnet-4-20250514", max_tokens=100, system="test", messages=[{"role": "user", "content": "test"}])
    assert wrapped.stats().total_requests == 1
    wrapped.reset_stats()
    assert wrapped.stats().total_requests == 0


def test_passthrough():
    client, _ = _mock_client()
    client.some_method = MagicMock(return_value="hello")
    wrapped = optimize_anthropic(client)
    assert wrapped.some_method() == "hello"


def test_disabled():
    client, _ = _mock_client()
    wrapped = optimize_anthropic(client, AnthropicCacheOptions(enabled=False))
    wrapped.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        system="You are a helpful assistant.",
        messages=[{"role": "user", "content": "test"}],
    )
    call_kwargs = client.messages.create.call_args[1]
    assert isinstance(call_kwargs["system"], str)

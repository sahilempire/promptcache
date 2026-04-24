from unittest.mock import MagicMock
from cachellm.providers.openai import optimize_openai
from cachellm.types import OpenAICacheOptions


def _mock_client(**details_overrides):
    details = MagicMock()
    details.cached_tokens = details_overrides.get("cached_tokens", 0)

    usage = MagicMock()
    usage.prompt_tokens = 150
    usage.completion_tokens = 30
    usage.prompt_tokens_details = details

    response = MagicMock()
    response.model = "gpt-4o"
    response.usage = usage

    client = MagicMock()
    client.chat.completions.create = MagicMock(return_value=response)
    return client, response


def test_exposes_stats():
    client, _ = _mock_client()
    wrapped = optimize_openai(client)
    assert callable(wrapped.stats)
    assert callable(wrapped.print_stats)
    assert callable(wrapped.reset_stats)


def test_proxies_calls():
    client, _ = _mock_client()
    wrapped = optimize_openai(client)
    wrapped.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are helpful."}, {"role": "user", "content": "Hi"}],
    )
    client.chat.completions.create.assert_called_once()


def test_reorders_system_messages():
    client, _ = _mock_client()
    wrapped = optimize_openai(client)
    wrapped.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Short."},
            {"role": "system", "content": "This is a much longer system message that should come first."},
            {"role": "user", "content": "Hello"},
        ],
    )
    call_kwargs = client.chat.completions.create.call_args[1]
    msgs = call_kwargs["messages"]
    assert msgs[0]["role"] == "system"
    assert "much longer" in msgs[0]["content"]
    assert msgs[1]["content"] == "Short."
    assert msgs[2]["role"] == "user"


def test_no_reorder_single_system():
    client, _ = _mock_client()
    wrapped = optimize_openai(client)
    wrapped.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "Only one."}, {"role": "user", "content": "Hello"}],
    )
    call_kwargs = client.chat.completions.create.call_args[1]
    msgs = call_kwargs["messages"]
    assert msgs[0]["content"] == "Only one."


def test_tracks_cached_tokens():
    client, _ = _mock_client(cached_tokens=80)
    wrapped = optimize_openai(client)
    wrapped.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": "test"}])
    stats = wrapped.stats()
    assert stats.total_requests == 1
    assert stats.cached_input_tokens == 80
    assert stats.cache_hits == 1


def test_zero_cached_is_miss():
    client, _ = _mock_client(cached_tokens=0)
    wrapped = optimize_openai(client)
    wrapped.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": "test"}])
    stats = wrapped.stats()
    assert stats.cache_hits == 0
    assert stats.cache_misses == 1


def test_reset():
    client, _ = _mock_client()
    wrapped = optimize_openai(client)
    wrapped.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": "test"}])
    assert wrapped.stats().total_requests == 1
    wrapped.reset_stats()
    assert wrapped.stats().total_requests == 0


def test_passthrough():
    client, _ = _mock_client()
    client.models = MagicMock()
    client.models.list = MagicMock(return_value="models")
    wrapped = optimize_openai(client)
    assert wrapped.models.list() == "models"


def test_disabled():
    client, _ = _mock_client()
    wrapped = optimize_openai(client, OpenAICacheOptions(enabled=False))
    wrapped.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Short."},
            {"role": "system", "content": "Longer message."},
            {"role": "user", "content": "Hello"},
        ],
    )
    call_kwargs = client.chat.completions.create.call_args[1]
    msgs = call_kwargs["messages"]
    assert msgs[0]["content"] == "Short."


def test_reorder_disabled():
    client, _ = _mock_client()
    wrapped = optimize_openai(client, OpenAICacheOptions(reorder_system_messages=False))
    wrapped.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "A"}, {"role": "system", "content": "BB"}, {"role": "user", "content": "Hello"}],
    )
    call_kwargs = client.chat.completions.create.call_args[1]
    msgs = call_kwargs["messages"]
    assert msgs[0]["content"] == "A"
    assert msgs[1]["content"] == "BB"

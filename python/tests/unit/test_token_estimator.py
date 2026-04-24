from cachellm.core.token_estimator import estimate_tokens, estimate_tokens_for_object


def test_empty_string():
    assert estimate_tokens("") == 0


def test_english_text():
    text = "Hello, how are you doing today?"
    est = estimate_tokens(text)
    assert 5 < est < 15


def test_longer_text():
    text = "The quick brown fox jumps over the lazy dog. " * 100
    est = estimate_tokens(text)
    assert 800 < est < 1500


def test_code_content():
    code = "function foo(x: number): { return x * 2; }"
    prose = "The function takes a number and returns it doubled"
    assert estimate_tokens(code) > 0
    assert estimate_tokens(prose) > 0


def test_non_ascii():
    cjk = "这是一个测试句子用于估算令牌数量"
    assert estimate_tokens(cjk) > 5


def test_object():
    obj = {
        "name": "get_weather",
        "description": "Get the current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {"location": {"type": "string", "description": "City name"}},
        },
    }
    est = estimate_tokens_for_object(obj)
    assert 20 < est < 100

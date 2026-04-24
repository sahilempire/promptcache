from cachellm.core.analyzer import PromptAnalyzer


def test_system_prompt_is_stable():
    analyzer = PromptAnalyzer()
    analysis = analyzer.analyze_anthropic_params({
        "system": "You are a helpful assistant who specializes in cooking recipes from around the world.",
        "messages": [{"role": "user", "content": "What is biryani?"}],
    })
    seg = next(s for s in analysis.segments if s.path == "system")
    assert seg.stability_score >= 0.9


def test_user_message_is_variable():
    analyzer = PromptAnalyzer()
    analysis = analyzer.analyze_anthropic_params({
        "system": "You are helpful.",
        "messages": [{"role": "user", "content": "Hello"}],
    })
    seg = next(s for s in analysis.segments if s.path == "messages[0]")
    assert seg.stability_score <= 0.3


def test_tools_are_stable():
    analyzer = PromptAnalyzer()
    analysis = analyzer.analyze_anthropic_params({
        "system": "You are helpful.",
        "tools": [
            {"name": "get_weather", "description": "Get weather data", "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}}},
            {"name": "search", "description": "Search the web", "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}}},
        ],
        "messages": [{"role": "user", "content": "What is the weather?"}],
    })
    seg = next(s for s in analysis.segments if s.path == "tools")
    assert seg.stability_score >= 0.9


def test_repeated_content_increases_stability():
    analyzer = PromptAnalyzer()
    system = "You are a cooking expert. Help users with recipes."

    analyzer.analyze_anthropic_params({
        "system": system,
        "messages": [{"role": "user", "content": "Recipe for pasta"}],
    })
    analysis = analyzer.analyze_anthropic_params({
        "system": system,
        "messages": [{"role": "user", "content": "Recipe for biryani"}],
    })
    seg = next(s for s in analysis.segments if s.path == "system")
    assert seg.stability_score >= 0.9


def test_older_messages_more_stable():
    analyzer = PromptAnalyzer()
    analysis = analyzer.analyze_anthropic_params({
        "system": "You are helpful.",
        "messages": [
            {"role": "user", "content": "First message"},
            {"role": "assistant", "content": "First response"},
            {"role": "user", "content": "Second question"},
            {"role": "assistant", "content": "Second response"},
            {"role": "user", "content": "Third question"},
            {"role": "assistant", "content": "Third response"},
            {"role": "user", "content": "Latest question"},
        ],
    })
    first = next(s for s in analysis.segments if s.path == "messages[0]")
    last = next(s for s in analysis.segments if s.path == "messages[6]")
    assert first.stability_score > last.stability_score


def test_cacheable_tokens_summary():
    analyzer = PromptAnalyzer()
    analysis = analyzer.analyze_anthropic_params({
        "system": "A" * 4000,
        "messages": [{"role": "user", "content": "Short question"}],
    })
    assert analysis.total_tokens > 0
    assert analysis.cacheable_tokens > 0
    assert len(analysis.stable_segments) > 0
    assert analysis.estimated_savings_percent > 0


def test_block_style_system():
    analyzer = PromptAnalyzer()
    analysis = analyzer.analyze_anthropic_params({
        "system": [
            {"type": "text", "text": "You are a helpful assistant."},
            {"type": "text", "text": "Always be concise and accurate."},
        ],
        "messages": [{"role": "user", "content": "Hi"}],
    })
    system_blocks = [s for s in analysis.segments if s.path.startswith("system")]
    assert len(system_blocks) == 2
    assert system_blocks[0].stability_score >= 0.9

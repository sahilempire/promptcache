"use client";

import { useState, useEffect } from "react";

function TypeWriter({ text, speed = 40, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [displayed, text, speed, started]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-[8px] h-[14px] bg-orange-500 ml-[1px]" style={{ animation: "blink 0.8s infinite" }} />
      )}
    </span>
  );
}

function Counter({ end, duration = 2000, delay = 0, prefix = "", suffix = "" }: { end: number; duration?: number; delay?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const steps = 40;
    const increment = end / steps;
    const stepTime = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [end, duration, started]);

  return <span>{prefix}{count}{suffix}</span>;
}

function TerminalDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3400),
      setTimeout(() => setStep(4), 4200),
      setTimeout(() => setStep(5), 5000),
      setTimeout(() => setStep(6), 6200),
      setTimeout(() => setStep(7), 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="border border-[#222] bg-[#0d0d0d] p-5 font-mono text-[12px] leading-relaxed">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#222]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[#555] text-[11px]">terminal</span>
      </div>

      {step >= 0 && (
        <div className="animate-fade-up">
          <span className="text-[#555]">$</span> <span className="text-orange-400">npm install</span> cachellm
        </div>
      )}

      {step >= 1 && (
        <div className="animate-fade-up text-[#555] mt-1">
          added 1 package in 0.8s
        </div>
      )}

      {step >= 2 && (
        <div className="mt-4 animate-fade-up">
          <span className="text-[#555]">$</span> <span className="text-orange-400">node</span> app.ts
        </div>
      )}

      {step >= 3 && (
        <div className="animate-fade-up text-[#555] mt-1">
          [cachellm] analyzing prompt... 3 segments found
        </div>
      )}

      {step >= 4 && (
        <div className="animate-fade-up text-[#555]">
          [cachellm] placed 2 breakpoints (system + tools)
        </div>
      )}

      {step >= 5 && (
        <div className="animate-fade-up text-green-400 mt-1">
          [cachellm] cache hit! 2,100 tokens cached (90% off)
        </div>
      )}

      {step >= 6 && (
        <div className="mt-4 animate-fade-up">
          <div className="text-[#555]">┌──────────────────────────────────────┐</div>
          <div className="text-[#555]">│                                      │</div>
          <div>│  <span className="text-white font-bold">cachellm</span>                           │</div>
          <div>│  Requests:      <span className="text-white">48</span>                    │</div>
          <div>│  Cache hits:    <span className="text-green-400">42 (87.5%)</span>            │</div>
          <div>│  Tokens cached: <span className="text-white">284.2K</span>                │</div>
          <div>│  Saved:         <span className="text-green-400">$2.14 (84.3%)</span>         │</div>
          <div className="text-[#555]">│                                      │</div>
          <div className="text-[#555]">└──────────────────────────────────────┘</div>
        </div>
      )}

      {step >= 7 && (
        <div className="mt-3 animate-fade-up">
          <span className="text-[#555]">$</span>{" "}
          <span className="inline-block w-[8px] h-[14px] bg-[#555]" style={{ animation: "blink 1s infinite" }} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyInstall = () => {
    navigator.clipboard.writeText("npm install cachellm");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-[820px] mx-auto px-6 py-16">

      {/* ═══════ HEADER ═══════ */}
      <header className="mb-16">
        <div className="text-[#555] text-[11px] mb-6 animate-fade-up">
          ####################################################################
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-up delay-1">
          <TypeWriter text="cachellm" speed={80} />
        </h1>

        <p className="text-[#888] text-sm mb-8 max-w-lg animate-fade-up delay-3">
          Auto-optimize LLM prompt caching. One line of code.
          <br />
          <span className="text-orange-400">60-90% savings</span> on your Claude &amp; GPT API bills.
        </p>

        <div className="flex flex-wrap gap-3 mb-8 animate-fade-up delay-4">
          <button
            onClick={copyInstall}
            className="border border-[#333] bg-[#111] px-4 py-2.5 text-[12px] hover:border-orange-500 transition-colors cursor-pointer flex items-center gap-3"
          >
            <span className="text-[#555]">$</span>
            <span>npm install cachellm</span>
            <span className="text-[#555] text-[10px] ml-2">{copied ? "COPIED" : "COPY"}</span>
          </button>

          <a
            href="https://github.com/sahilempire/cachellm"
            target="_blank"
            className="border border-[#333] bg-[#111] px-4 py-2.5 text-[12px] hover:border-[#555] transition-colors flex items-center gap-2"
          >
            GITHUB ↗
          </a>

          <a
            href="https://www.npmjs.com/package/cachellm"
            target="_blank"
            className="border border-[#333] bg-[#111] px-4 py-2.5 text-[12px] hover:border-[#555] transition-colors flex items-center gap-2"
          >
            NPM ↗
          </a>
        </div>

        <div className="text-[#555] text-[11px] animate-fade-up delay-5">
          ────────────────────────────────────────────────────────────────────
        </div>
      </header>

      {/* ═══════ THE PROBLEM ═══════ */}
      <section className="mb-16 animate-fade-up delay-5">
        <div className="text-[#555] text-[11px] mb-4">## THE_PROBLEM</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#222]">
          <div className="p-5 border-b md:border-b-0 md:border-r border-[#222]">
            <div className="text-[#555] text-[10px] mb-3 uppercase tracking-widest">Without cachellm</div>
            <div className="space-y-2 text-[12px]">
              <div><span className="text-[#555]">call_1:</span> system_prompt (2000 tokens) <span className="text-red-400">→ FULL PRICE</span></div>
              <div><span className="text-[#555]">call_2:</span> system_prompt (2000 tokens) <span className="text-red-400">→ FULL PRICE</span></div>
              <div><span className="text-[#555]">call_3:</span> system_prompt (2000 tokens) <span className="text-red-400">→ FULL PRICE</span></div>
              <div className="pt-3 border-t border-[#222]">
                <span className="text-[#555]">monthly_bill:</span> <span className="text-red-400 font-bold">$300</span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="text-[#555] text-[10px] mb-3 uppercase tracking-widest">With cachellm</div>
            <div className="space-y-2 text-[12px]">
              <div><span className="text-[#555]">call_1:</span> system_prompt (2000 tokens) <span className="text-orange-400">→ CACHE CREATED</span></div>
              <div><span className="text-[#555]">call_2:</span> system_prompt (2000 tokens) <span className="text-green-400">→ 90% OFF</span></div>
              <div><span className="text-[#555]">call_3:</span> system_prompt (2000 tokens) <span className="text-green-400">→ 90% OFF</span></div>
              <div className="pt-3 border-t border-[#222]">
                <span className="text-[#555]">monthly_bill:</span> <span className="text-green-400 font-bold">$40</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ DEMO ═══════ */}
      <section className="mb-16">
        <div className="text-[#555] text-[11px] mb-4">## DEMO</div>
        <TerminalDemo />
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="mb-16 animate-fade-up">
        <div className="text-[#555] text-[11px] mb-4">## HOW_IT_WORKS</div>

        <div className="border border-[#222] text-[12px]">
          <div className="p-4 border-b border-[#222] flex items-start gap-4">
            <span className="text-orange-400 font-bold w-6 shrink-0">01</span>
            <div>
              <span className="text-white font-bold">ANALYZE</span>
              <span className="text-[#555] ml-3">scans your prompt, finds system instructions, tool definitions, documents</span>
            </div>
          </div>
          <div className="p-4 border-b border-[#222] flex items-start gap-4">
            <span className="text-orange-400 font-bold w-6 shrink-0">02</span>
            <div>
              <span className="text-white font-bold">SCORE</span>
              <span className="text-[#555] ml-3">rates each segment by stability — is it the same every call or does it change?</span>
            </div>
          </div>
          <div className="p-4 border-b border-[#222] flex items-start gap-4">
            <span className="text-orange-400 font-bold w-6 shrink-0">03</span>
            <div>
              <span className="text-white font-bold">INJECT</span>
              <span className="text-[#555] ml-3">places cache_control breakpoints at optimal positions automatically</span>
            </div>
          </div>
          <div className="p-4 flex items-start gap-4">
            <span className="text-orange-400 font-bold w-6 shrink-0">04</span>
            <div>
              <span className="text-white font-bold">TRACK</span>
              <span className="text-[#555] ml-3">monitors cache hits, calculates actual dollar savings in real time</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ QUICK START ═══════ */}
      <section className="mb-16">
        <div className="text-[#555] text-[11px] mb-4">## QUICK_START</div>

        <div className="border border-[#222] bg-[#0d0d0d] p-5 text-[12px] leading-relaxed">
          <div className="text-[#555] mb-3">// one line change to your existing code</div>
          <div>
            <span className="text-orange-400">import</span> Anthropic <span className="text-orange-400">from</span> <span className="text-green-400">{`'@anthropic-ai/sdk'`}</span>
          </div>
          <div>
            <span className="text-orange-400">import</span> {"{ optimizeAnthropic }"} <span className="text-orange-400">from</span> <span className="text-green-400">{`'cachellm'`}</span>
          </div>
          <div className="mt-3">
            <span className="text-[#555]">// wrap your client — that&apos;s it</span>
          </div>
          <div>
            <span className="text-orange-400">const</span> client = <span className="text-yellow-300">optimizeAnthropic</span>(<span className="text-orange-400">new</span> <span className="text-yellow-300">Anthropic</span>())
          </div>
          <div className="mt-3">
            <span className="text-[#555]">// everything else stays exactly the same</span>
          </div>
          <div>
            <span className="text-orange-400">const</span> res = <span className="text-orange-400">await</span> client.messages.<span className="text-yellow-300">create</span>({`({`}
          </div>
          <div className="pl-4"><span className="text-white">model:</span> <span className="text-green-400">{`'claude-sonnet-4-20250514'`}</span>,</div>
          <div className="pl-4"><span className="text-white">system:</span> <span className="text-green-400">{`'You are a helpful assistant...'`}</span>,</div>
          <div className="pl-4"><span className="text-white">messages:</span> [{`{ role: 'user', content: 'Hello' }`}],</div>
          <div>{`})`}</div>
          <div className="mt-3">
            client.<span className="text-yellow-300">printStats</span>() <span className="text-[#555]">// see your savings</span>
          </div>
        </div>
      </section>

      {/* ═══════ NUMBERS ═══════ */}
      <section className="mb-16">
        <div className="text-[#555] text-[11px] mb-4">## SAVINGS_AT_SCALE</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#222]">
          {[
            { label: "100 req/day", before: 9, after: 1.35, save: 7.65 },
            { label: "500 req/day", before: 45, after: 6.75, save: 38.25 },
            { label: "1K req/day", before: 90, after: 13.5, save: 76.5 },
            { label: "10K req/day", before: 900, after: 135, save: 765 },
          ].map((tier, i) => (
            <div key={i} className={`p-5 text-center ${i < 3 ? "border-r border-[#222]" : ""}`}>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-3">{tier.label}</div>
              <div className="text-[#555] text-[11px] line-through mb-1">${tier.before}</div>
              <div className="text-green-400 text-xl font-bold">
                $<Counter end={tier.after} delay={500 + i * 200} />
              </div>
              <div className="text-[10px] text-[#555] mt-2">save ${tier.save}/day</div>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-[#333] mt-2">
          * based on 3K token system prompt, claude sonnet, 90% cache hit rate
        </div>
      </section>

      {/* ═══════ PROVIDERS ═══════ */}
      <section className="mb-16">
        <div className="text-[#555] text-[11px] mb-4">## PROVIDERS</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="border border-[#222] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold text-sm">ANTHROPIC</span>
              <span className="text-[10px] text-green-400 border border-green-400/30 px-2 py-0.5">SUPPORTED</span>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-[#555]">method</span><span>manual breakpoints</span></div>
              <div className="flex justify-between"><span className="text-[#555]">savings</span><span className="text-green-400">up to 90%</span></div>
              <div className="flex justify-between"><span className="text-[#555]">min_tokens</span><span>1,024</span></div>
              <div className="flex justify-between"><span className="text-[#555]">ttl</span><span>5min / 1hr</span></div>
              <div className="flex justify-between"><span className="text-[#555]">cachellm_does</span><span>injects cache_control</span></div>
            </div>
          </div>

          <div className="border border-[#222] md:border-l-0 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold text-sm">OPENAI</span>
              <span className="text-[10px] text-green-400 border border-green-400/30 px-2 py-0.5">SUPPORTED</span>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-[#555]">method</span><span>automatic prefix</span></div>
              <div className="flex justify-between"><span className="text-[#555]">savings</span><span className="text-green-400">up to 50%</span></div>
              <div className="flex justify-between"><span className="text-[#555]">min_tokens</span><span>1,024</span></div>
              <div className="flex justify-between"><span className="text-[#555]">ttl</span><span>5-10min</span></div>
              <div className="flex justify-between"><span className="text-[#555]">cachellm_does</span><span>reorders for prefix</span></div>
            </div>
          </div>
        </div>

        <div className="border border-[#222] border-t-0 p-4 text-center text-[12px] text-[#555]">
          GEMINI <span className="text-[#333]">|</span> coming soon <span className="text-[#333]">|</span>{" "}
          <a href="https://github.com/sahilempire/cachellm/issues/1" target="_blank" className="text-orange-400 hover:underline">
            track progress →
          </a>
        </div>
      </section>

      {/* ═══════ ARCHITECTURE ═══════ */}
      <section className="mb-16">
        <div className="text-[#555] text-[11px] mb-4">## ARCHITECTURE</div>

        <div className="border border-[#222] bg-[#0d0d0d] p-5 text-[11px] leading-loose overflow-x-auto">
          <pre className="text-[#888]">{`    ┌──────────────────────────────────────────┐
    │            YOUR APPLICATION               │
    │                                          │
    │  const client = optimizeAnthropic(...)   │
    └─────────────────┬────────────────────────┘
                      │
                      ▼
    ┌──────────────────────────────────────────┐
    │          cachellm  (proxy layer)         │
    │                                          │
    │   ┌──────────┐ ┌─────────┐ ┌─────────┐  │
    │   │ ANALYZER │ │STRATEGY │ │  STATS  │  │
    │   │          │ │         │ │         │  │
    │   │ scores   │ │ picks   │ │ tracks  │  │
    │   │ segments │ │ where   │ │ hits &  │  │
    │   │ by       │ │ to put  │ │ savings │  │
    │   │ stability│ │ breaks  │ │         │  │
    │   └────┬─────┘ └────┬────┘ └────┬────┘  │
    │        └─────────────┘          │        │
    │              │                  │        │
    │   ┌──────────▼──────────────┐   │        │
    │   │   PROVIDER ADAPTERS     │   │        │
    │   │                         │   │        │
    │   │  anthropic │  openai    │   │        │
    │   │  injects   │  reorders  │   │        │
    │   │  cache_    │  for       │   │        │
    │   │  control   │  prefix    │   │        │
    │   └─────┬──────┴─────┬──────┘   │        │
    └─────────┼────────────┼──────────┼────────┘
              │            │          │
              ▼            ▼          ▼
    ┌─────────────┐ ┌───────────┐ ┌─────────┐
    │  CLAUDE API │ │  GPT API  │ │TERMINAL │
    │  90% off    │ │  50% off  │ │ $saved  │
    └─────────────┘ └───────────┘ └─────────┘`}</pre>
        </div>
      </section>

      {/* ═══════ DESIGN PRINCIPLES ═══════ */}
      <section className="mb-16">
        <div className="text-[#555] text-[11px] mb-4">## DESIGN_PRINCIPLES</div>

        <div className="space-y-0">
          {[
            { title: "ZERO_DEPENDENCIES", desc: "no tiktoken (3MB wasm), no redis, no external services. token estimation uses a fast heuristic." },
            { title: "ZERO_INFRASTRUCTURE", desc: "everything runs in-process. no proxy servers, no databases, no config files. npm install and done." },
            { title: "ZERO_CODE_CHANGES", desc: "javascript proxy wraps your client transparently. all methods, props, and typescript types pass through." },
            { title: "UNDER_15KB", desc: "gzipped. smaller than most favicons." },
          ].map((p, i) => (
            <div key={i} className="border border-[#222] p-4 flex items-start gap-4">
              <span className="text-orange-400 text-[12px] font-bold shrink-0 w-[180px]">{p.title}</span>
              <span className="text-[#555] text-[12px]">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-[#222] pt-8">
        <div className="text-[#555] text-[11px] mb-6">
          ####################################################################
        </div>

        <div className="flex flex-wrap gap-8 text-[12px] mb-8">
          <div>
            <div className="text-[#555] text-[10px] uppercase tracking-widest mb-2">links</div>
            <div className="space-y-1">
              <div><a href="https://github.com/sahilempire/cachellm" target="_blank" className="text-[#888] hover:text-orange-400 transition-colors">github ↗</a></div>
              <div><a href="https://www.npmjs.com/package/cachellm" target="_blank" className="text-[#888] hover:text-orange-400 transition-colors">npm ↗</a></div>
              <div><a href="https://github.com/sahilempire/cachellm/issues" target="_blank" className="text-[#888] hover:text-orange-400 transition-colors">issues ↗</a></div>
            </div>
          </div>

          <div>
            <div className="text-[#555] text-[10px] uppercase tracking-widest mb-2">resources</div>
            <div className="space-y-1">
              <div><a href="https://github.com/sahilempire/cachellm#quick-start" target="_blank" className="text-[#888] hover:text-orange-400 transition-colors">docs</a></div>
              <div><a href="https://github.com/sahilempire/cachellm/tree/main/examples" target="_blank" className="text-[#888] hover:text-orange-400 transition-colors">examples</a></div>
              <div><a href="https://github.com/sahilempire/cachellm/blob/main/CONTRIBUTING.md" target="_blank" className="text-[#888] hover:text-orange-400 transition-colors">contributing</a></div>
            </div>
          </div>

          <div>
            <div className="text-[#555] text-[10px] uppercase tracking-widest mb-2">author</div>
            <div className="space-y-1">
              <div><a href="https://github.com/sahilempire" target="_blank" className="text-[#888] hover:text-orange-400 transition-colors">@sahilempire</a></div>
            </div>
          </div>
        </div>

        <div className="text-[#333] text-[11px] pb-8">
          ── MIT LICENSE ── BUILT WITH CARE ── 2026 ──────────────────────────
        </div>
      </footer>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";

/* ═══════ COUNTER ═══════ */
function Counter({ end, suffix = "", delay = 0 }: { end: number; suffix?: string; delay?: number }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const steps = 40;
    const inc = end / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(cur));
    }, 30);
    return () => clearInterval(timer);
  }, [end, started]);

  return <>{val}{suffix}</>;
}

/* ═══════ TERMINAL ═══════ */
function Terminal() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2800),
      setTimeout(() => setStep(4), 3600),
      setTimeout(() => setStep(5), 4400),
      setTimeout(() => setStep(6), 5600),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="code-block" style={{ background: "#fff", border: "2px solid #000" }}>
      {step >= 0 && <div><span className="cmt">$</span> npm install cachellm</div>}
      {step >= 1 && <div className="cmt">added 1 package in 0.8s</div>}
      {step >= 2 && <div style={{ marginTop: 12 }}><span className="cmt">$</span> node app.ts</div>}
      {step >= 3 && <div className="cmt">[cachellm] analyzing... 3 segments found</div>}
      {step >= 4 && <div className="cmt">[cachellm] breakpoints: system(2100tk) + tools(800tk)</div>}
      {step >= 5 && <div style={{ color: "#000", fontWeight: 700 }}>[cachellm] cache hit — 2,100 tokens at 90% discount</div>}
      {step >= 6 && (
        <pre style={{ marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 12, fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit", margin: 0 }}>{
`┌───────────────────────────────────┐
│                                   │
│  cachellm                         │
│  requests:      48                │
│  cache_hits:    42 (87.5%)        │
│  tokens_saved:  284,200           │
│  cost_saved:    $2.14 (84.3%)     │
│                                   │
└───────────────────────────────────┘`
        }</pre>
      )}
    </div>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export default function Home() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText("npm install cachellm");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ═══════ NAV ═══════ */}
      <nav style={{ borderBottom: "1px solid #000" }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between" style={{ height: 48 }}>
          <span className="kicker" style={{ fontSize: 14, letterSpacing: "0.5px" }}>CACHELLM</span>
          <div className="flex gap-6">
            {["GITHUB", "NPM", "DOCS"].map((label, i) => (
              <a
                key={label}
                href={
                  label === "GITHUB" ? "https://github.com/sahilempire/cachellm" :
                  label === "NPM" ? "https://www.npmjs.com/package/cachellm" :
                  "https://github.com/sahilempire/cachellm#quick-start"
                }
                target="_blank"
                className="kicker-light hover:text-[#057dbc]"
                style={{ transition: "color 120ms", textDecoration: "none" }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6">

        {/* ═══════ HERO ═══════ */}
        <header className="pt-16 pb-12 animate-in" style={{ borderBottom: "2px solid #000" }}>
          <div className="kicker mb-4 animate-in d1">OPEN SOURCE</div>

          <h1 className="display animate-in d2" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
            cachellm
          </h1>

          <p className="body-serif mt-6 max-w-xl animate-in d3" style={{ color: "#1a1a1a" }}>
            Auto-optimize LLM prompt caching. One line of code.{" "}
            <span style={{ fontWeight: 600 }}>60–90% savings</span>{" "}on your Claude &amp; GPT API bills.
          </p>

          <div className="flex flex-wrap gap-3 mt-8 animate-in d4">
            <button onClick={copy} className="btn-editorial" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, gap: 12 }}>
              <span style={{ color: "#757575" }}>$</span>
              <span>npm install cachellm</span>
              <span style={{ color: "#999", fontSize: 10, letterSpacing: "1px", borderLeft: "1px solid #e2e8f0", paddingLeft: 12 }}>{copied ? "COPIED" : "COPY"}</span>
            </button>
            <a href="https://github.com/sahilempire/cachellm" target="_blank" className="btn-editorial">
              VIEW SOURCE →
            </a>
          </div>
        </header>

        {/* ═══════ NUMBERS ═══════ */}
        <section className="py-12 animate-in d5" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { label: "CACHE HIT RATE", value: 90, suffix: "%" },
              { label: "COST REDUCTION", value: 84, suffix: "%" },
              { label: "DEPENDENCIES", value: 0, suffix: "", static: true },
              { label: "BUNDLE SIZE", value: 15, suffix: "KB" },
            ].map((s, i) => (
              <div
                key={i}
                className="py-6 pr-8"
                style={{ borderRight: i < 3 ? "1px solid #e2e8f0" : "none" }}
              >
                <div className="kicker-light mb-2">{s.label}</div>
                <div className="display" style={{ fontSize: 40 }}>
                  {s.static ? "0" : <Counter end={s.value} delay={400 + i * 150} suffix={s.suffix} />}
                  {s.static && s.suffix}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ THE PROBLEM ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">THE PROBLEM</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="pr-8 pb-8 md:pb-0" style={{ borderRight: "1px solid #000" }}>
              <div className="kicker mb-4" style={{ color: "#757575" }}>WITHOUT CACHELLM</div>
              <div className="code-block" style={{ fontSize: 13 }}>
                <div><span className="cmt">call_1:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div><span className="cmt">call_2:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div><span className="cmt">call_3:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 12, paddingTop: 12 }}>
                  monthly_bill: <span style={{ fontSize: 20, fontWeight: 700, color: "#d73a49" }}>$300</span>
                </div>
              </div>
            </div>

            <div className="pl-0 md:pl-8 pt-8 md:pt-0">
              <div className="kicker mb-4">WITH CACHELLM</div>
              <div className="code-block" style={{ fontSize: 13 }}>
                <div><span className="cmt">call_1:</span> system_prompt (2000tk) → <span style={{ color: "#6f42c1" }}>CACHE WRITE</span></div>
                <div><span className="cmt">call_2:</span> system_prompt (2000tk) → <span style={{ color: "#032f62", fontWeight: 700 }}>90% OFF ✓</span></div>
                <div><span className="cmt">call_3:</span> system_prompt (2000tk) → <span style={{ color: "#032f62", fontWeight: 700 }}>90% OFF ✓</span></div>
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 12, paddingTop: 12 }}>
                  monthly_bill: <span style={{ fontSize: 20, fontWeight: 700 }}>$40</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ LIVE TERMINAL ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">LIVE DEMO</div>
          <Terminal />
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">HOW IT WORKS</div>

          {[
            { n: "01", title: "ANALYZE", desc: "Scans your prompt structure — identifies system instructions, tool schemas, static documents." },
            { n: "02", title: "SCORE", desc: "Rates each segment by stability. Tracks content hashes across requests to detect what actually repeats." },
            { n: "03", title: "INJECT", desc: "Places cache_control breakpoints at optimal positions. Up to 4 per request on Anthropic." },
            { n: "04", title: "TRACK", desc: "Monitors cache hit rates, token counts, and calculates real dollar savings per request." },
          ].map((step, i) => (
            <div key={i} className="flex gap-6 py-5" style={{ borderBottom: i < 3 ? "1px solid #e2e8f0" : "none" }}>
              <span className="display" style={{ fontSize: 32, color: "#000", minWidth: 48 }}>{step.n}</span>
              <div>
                <div className="kicker mb-1">{step.title}</div>
                <p style={{ color: "#757575", fontSize: 15, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ═══════ QUICK START ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">QUICK START</div>

          <div className="code-block" style={{ border: "2px solid #000" }}>
            <div className="cmt">// one line change to existing code</div>
            <div><span className="kw">import</span> Anthropic <span className="kw">from</span> <span className="str">&apos;@anthropic-ai/sdk&apos;</span></div>
            <div><span className="kw">import</span> {"{ optimizeAnthropic }"} <span className="kw">from</span> <span className="str">&apos;cachellm&apos;</span></div>
            <div style={{ marginTop: 16 }}><span className="cmt">// wrap once — everything else stays the same</span></div>
            <div><span className="kw">const</span> client = <span className="fn">optimizeAnthropic</span>(<span className="kw">new</span> <span className="fn">Anthropic</span>())</div>
            <div style={{ marginTop: 16 }}><span className="kw">const</span> res = <span className="kw">await</span> client.messages.<span className="fn">create</span>({"{"}</div>
            <div style={{ paddingLeft: 24 }}>model: <span className="str">&apos;claude-sonnet-4-20250514&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>system: <span className="str">&apos;You are a helpful assistant...&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>messages: [{"{ role: 'user', content: 'Hello' }"}],</div>
            <div>{"})"}</div>
            <div style={{ marginTop: 16 }}>client.<span className="fn">printStats</span>() <span className="cmt">// see your savings</span></div>
          </div>
        </section>

        {/* ═══════ COST PROJECTION ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">COST PROJECTION</div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <td className="kicker-light py-3">SCALE</td>
                <td className="kicker-light py-3 text-right">BEFORE</td>
                <td className="kicker-light py-3 text-right">AFTER</td>
                <td className="kicker-light py-3 text-right">SAVED</td>
              </tr>
            </thead>
            <tbody>
              {[
                { scale: "100 req/day", before: "$9", after: "$1.35", saved: "$7.65/day" },
                { scale: "500 req/day", before: "$45", after: "$6.75", saved: "$38/day" },
                { scale: "1,000 req/day", before: "$90", after: "$13.50", saved: "$76/day" },
                { scale: "10,000 req/day", before: "$900", after: "$135", saved: "$765/day" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td className="py-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{row.scale}</td>
                  <td className="py-4 text-right" style={{ color: "#757575", textDecoration: "line-through" }}>{row.before}</td>
                  <td className="py-4 text-right" style={{ fontWeight: 700 }}>{row.after}</td>
                  <td className="py-4 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#757575" }}>{row.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="kicker-light mt-4" style={{ fontSize: 10 }}>
            * CLAUDE SONNET / 3K TOKEN SYSTEM PROMPT / 90% HIT RATE
          </p>
        </section>

        {/* ═══════ PROVIDERS ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">SUPPORTED PROVIDERS</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { name: "ANTHROPIC", status: "LIVE", savings: "90%", method: "cache_control injection", ttl: "5min / 1hr" },
              { name: "OPENAI", status: "LIVE", savings: "50%", method: "prefix reordering", ttl: "5–10min" },
              { name: "GEMINI", status: "LIVE", savings: "90%", method: "cache object mgmt", ttl: "configurable" },
            ].map((p, i) => (
              <div
                key={i}
                className="py-6 pr-6"
                style={{
                  borderRight: i < 2 ? "1px solid #e2e8f0" : "none",
                  paddingLeft: i > 0 ? 24 : 0,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="kicker">{p.name}</span>
                  <span className="kicker" style={{ fontSize: 10, color: p.status === "LIVE" ? "#000" : "#999" }}>
                    ● {p.status}
                  </span>
                </div>
                <div className="space-y-2" style={{ fontSize: 14 }}>
                  <div className="flex justify-between"><span className="kicker-light">SAVINGS</span><span style={{ fontWeight: 600 }}>{p.savings}</span></div>
                  <div className="flex justify-between"><span className="kicker-light">METHOD</span><span style={{ color: "#757575" }}>{p.method}</span></div>
                  <div className="flex justify-between"><span className="kicker-light">TTL</span><span style={{ color: "#757575" }}>{p.ttl}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ ARCHITECTURE ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">ARCHITECTURE</div>

          <div className="code-block" style={{ border: "2px solid #000", fontSize: 12, lineHeight: 1.8 }}>
            <pre>{`  YOUR APP
    │
    │  const client = optimizeAnthropic(new Anthropic())
    │
    ▼
  ┌─────────────────────────────────────────┐
  │            cachellm                     │
  │                                         │
  │   ANALYZER      STRATEGY      STATS     │
  │   scores        picks         tracks    │
  │   segments      breakpoint    hits &    │
  │   by stability  positions     savings   │
  │        │             │           │      │
  │        └─────────────┘           │      │
  │              │                   │      │
  │   ┌──────────▼────────────┐     │      │
  │   │  PROVIDER ADAPTERS    │     │      │
  │   │                       │     │      │
  │   │  anthropic  openai    │     │      │
  │   │  gemini               │     │      │
  │   └──────┬────────┬───────┘     │      │
  └──────────┼────────┼─────────────┼──────┘
             │        │             │
             ▼        ▼             ▼
  ┌────────────┐ ┌────────┐ ┌───────────┐
  │ Claude API │ │GPT API │ │ Terminal  │
  │ 90% off    │ │50% off │ │ \$ saved  │
  └────────────┘ └────────┘ └───────────┘`}</pre>
          </div>
        </section>

        {/* ═══════ DESIGN PRINCIPLES ═══════ */}
        <section className="py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon mb-8 inline-block">DESIGN PRINCIPLES</div>

          {[
            { key: "ZERO DEPENDENCIES", val: "No tiktoken (3MB), no Redis, no external services. Token estimation uses a fast heuristic." },
            { key: "ZERO INFRASTRUCTURE", val: "Everything runs in-process. No proxy, no database, no config. npm install and done." },
            { key: "ZERO CODE CHANGES", val: "JavaScript Proxy wraps your client. All methods, props, and TypeScript types pass through unchanged." },
            { key: "UNDER 15KB GZIPPED", val: "Smaller than most favicons." },
          ].map((p, i) => (
            <div key={i} className="flex gap-8 py-5" style={{ borderBottom: i < 3 ? "1px solid #e2e8f0" : "none" }}>
              <span className="kicker shrink-0" style={{ minWidth: 200 }}>{p.key}</span>
              <span style={{ color: "#757575", fontSize: 15 }}>{p.val}</span>
            </div>
          ))}
        </section>

        {/* ═══════ ROADMAP ═══════ */}
        <section className="py-12" style={{ borderBottom: "2px solid #000" }}>
          <div className="ribbon mb-8 inline-block">ROADMAP</div>

          <div className="space-y-3" style={{ fontSize: 15 }}>
            {[
              { done: true, text: "Anthropic adapter (auto cache_control injection)" },
              { done: true, text: "OpenAI adapter (prefix optimization)" },
              { done: true, text: "Gemini adapter (cache object management)" },
              { done: true, text: "Streaming support" },
              { done: true, text: "Stats tracking with cost estimation" },
              { done: false, text: "Vercel AI SDK middleware" },
              { done: false, text: "CLI tool for analyzing prompts" },
              { done: false, text: "Python package (pip install cachellm)" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-baseline">
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: item.done ? "#000" : "#ccc" }}>
                  {item.done ? "■" : "□"}
                </span>
                <span style={{ color: item.done ? "#1a1a1a" : "#999" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ background: "#1a1a1a", color: "#fff", marginTop: 0 }}>
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="kicker mb-4" style={{ color: "#fff" }}>CACHELLM</div>
              <p style={{ color: "#757575", fontSize: 14, lineHeight: 1.6 }}>
                Auto-optimize LLM prompt caching.
                Zero dependencies. Zero config. MIT licensed.
              </p>
            </div>

            <div>
              <div className="kicker-light mb-4" style={{ color: "#757575" }}>LINKS</div>
              <div className="space-y-2" style={{ fontSize: 14 }}>
                <div><a href="https://github.com/sahilempire/cachellm" target="_blank" style={{ color: "#999", textDecoration: "none" }} className="hover:text-[#057dbc]">GitHub ↗</a></div>
                <div><a href="https://www.npmjs.com/package/cachellm" target="_blank" style={{ color: "#999", textDecoration: "none" }} className="hover:text-[#057dbc]">npm ↗</a></div>
                <div><a href="https://github.com/sahilempire/cachellm/issues" target="_blank" style={{ color: "#999", textDecoration: "none" }} className="hover:text-[#057dbc]">Issues ↗</a></div>
              </div>
            </div>

            <div>
              <div className="kicker-light mb-4" style={{ color: "#757575" }}>RESOURCES</div>
              <div className="space-y-2" style={{ fontSize: 14 }}>
                <div><a href="https://github.com/sahilempire/cachellm#quick-start" target="_blank" style={{ color: "#999", textDecoration: "none" }} className="hover:text-[#057dbc]">Documentation</a></div>
                <div><a href="https://github.com/sahilempire/cachellm/tree/main/examples" target="_blank" style={{ color: "#999", textDecoration: "none" }} className="hover:text-[#057dbc]">Examples</a></div>
                <div><a href="https://github.com/sahilempire/cachellm/blob/main/CONTRIBUTING.md" target="_blank" style={{ color: "#999", textDecoration: "none" }} className="hover:text-[#057dbc]">Contributing</a></div>
              </div>
            </div>

            <div>
              <div className="kicker-light mb-4" style={{ color: "#757575" }}>AUTHOR</div>
              <div style={{ fontSize: 14 }}>
                <a href="https://github.com/sahilempire" target="_blank" style={{ color: "#999", textDecoration: "none" }} className="hover:text-[#057dbc]">@sahilempire</a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #333", marginTop: 48, paddingTop: 16 }}>
            <span className="kicker-light" style={{ color: "#333", fontSize: 10 }}>
              MIT LICENSE — v0.2.0 — 2026
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

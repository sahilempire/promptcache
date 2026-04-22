"use client";

import { useState, useEffect } from "react";

function Counter({ end, suffix = "", delay = 0 }: { end: number; suffix?: string; delay?: number }) {
  const [val, setVal] = useState(0);
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => {
    if (!go) return;
    let cur = 0;
    const inc = end / 40;
    const t = setInterval(() => { cur += inc; if (cur >= end) { setVal(end); clearInterval(t); } else setVal(Math.floor(cur)); }, 30);
    return () => clearInterval(t);
  }, [end, go]);
  return <>{val}{suffix}</>;
}

function Terminal() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setS(1), 500), setTimeout(() => setS(2), 1500), setTimeout(() => setS(3), 2800), setTimeout(() => setS(4), 3600), setTimeout(() => setS(5), 4400), setTimeout(() => setS(6), 5600)];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div className="code-box" style={{ background: "#fff", border: "2px solid #000", padding: 28 }}>
      {s >= 0 && <div><span className="cmt">$</span> npm install cachellm</div>}
      {s >= 1 && <div className="cmt">added 1 package in 0.8s</div>}
      {s >= 2 && <div style={{ marginTop: 16 }}><span className="cmt">$</span> node app.ts</div>}
      {s >= 3 && <div className="cmt">[cachellm] analyzing... 3 segments found</div>}
      {s >= 4 && <div className="cmt">[cachellm] breakpoints: system(2100tk) + tools(800tk)</div>}
      {s >= 5 && <div style={{ fontWeight: 700, color: "#000" }}>[cachellm] cache hit — 2,100 tokens at 90% discount</div>}
      {s >= 6 && (
        <pre style={{ marginTop: 20, borderTop: "1px solid #e2e8f0", paddingTop: 16, fontFamily: "inherit", fontSize: "inherit", lineHeight: 1.6 }}>{
`┌───────────────────────────────────┐
│                                   │
│  cachellm                         │
│  requests:      48                │
│  cache_hits:    42 (87.5%)        │
│  tokens_saved:  284,200           │
│  cost_saved:    $2.14 (84.3%)     │
│                                   │
└───────────────────────────────────┘`}</pre>
      )}
    </div>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText("npm install cachellm"); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <>
      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #000", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <span className="kicker" style={{ fontSize: 14, letterSpacing: 0.5 }}>CACHELLM</span>
          <div style={{ display: "flex", gap: 28 }}>
            {[
              { label: "GITHUB", href: "https://github.com/sahilempire/cachellm" },
              { label: "NPM", href: "https://www.npmjs.com/package/cachellm" },
              { label: "DOCS", href: "https://github.com/sahilempire/cachellm#quick-start" },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" className="kicker-light" style={{ textDecoration: "none", transition: "color 120ms" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#057dbc")}
                onMouseLeave={e => (e.currentTarget.style.color = "#757575")}
              >{l.label}</a>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* HERO */}
        <header style={{ paddingTop: 72, paddingBottom: 56, borderBottom: "2px solid #000" }}>
          <div className="kicker" style={{ marginBottom: 16 }}>OPEN SOURCE</div>
          <h1 className="display-type" style={{ fontSize: "clamp(52px, 8vw, 84px)", marginBottom: 24 }}>cachellm</h1>
          <p className="body-serif" style={{ maxWidth: 560, marginBottom: 40 }}>
            Auto-optimize LLM prompt caching. One line of code.{" "}
            <span style={{ fontWeight: 600 }}>60–90% savings</span>{" "}
            on your Claude &amp; GPT API bills.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button onClick={copy} className="btn-ed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, gap: 12 }}>
              <span style={{ color: "#757575" }}>$</span>
              <span>npm install cachellm</span>
              <span style={{ color: "#999", fontSize: 10, letterSpacing: 1, borderLeft: "1px solid #e2e8f0", paddingLeft: 12 }}>{copied ? "COPIED" : "COPY"}</span>
            </button>
            <a href="https://github.com/sahilempire/cachellm" target="_blank" className="btn-ed">VIEW SOURCE →</a>
          </div>
        </header>

        {/* NUMBERS */}
        <section style={{ paddingTop: 48, paddingBottom: 48, borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {[
            { label: "CACHE HIT RATE", val: 90, suf: "%" },
            { label: "COST REDUCTION", val: 84, suf: "%" },
            { label: "DEPENDENCIES", val: 0, suf: "", static: true },
            { label: "BUNDLE SIZE", val: 15, suf: "KB" },
          ].map((s, i) => (
            <div key={i} style={{ paddingRight: 32, borderRight: i < 3 ? "1px solid #e2e8f0" : "none", paddingLeft: i > 0 ? 32 : 0 }}>
              <div className="kicker-light" style={{ marginBottom: 8 }}>{s.label}</div>
              <div className="display-type" style={{ fontSize: 44 }}>
                {s.static ? "0" : <Counter end={s.val} delay={400 + i * 150} suffix={s.suf} />}
                {s.static && s.suf}
              </div>
            </div>
          ))}
        </section>

        {/* THE PROBLEM */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>THE PROBLEM</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0 }}>
            <div style={{ paddingRight: 40 }}>
              <div className="kicker" style={{ color: "#757575", marginBottom: 20 }}>WITHOUT CACHELLM</div>
              <div className="code-box" style={{ fontSize: 13 }}>
                <div><span className="cmt">call_1:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div style={{ marginTop: 4 }}><span className="cmt">call_2:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div style={{ marginTop: 4 }}><span className="cmt">call_3:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 16, paddingTop: 16 }}>
                  monthly_bill: <span style={{ fontSize: 22, fontWeight: 700, color: "#d73a49" }}>$300</span>
                </div>
              </div>
            </div>
            <div style={{ background: "#000", width: 1 }} />
            <div style={{ paddingLeft: 40 }}>
              <div className="kicker" style={{ marginBottom: 20 }}>WITH CACHELLM</div>
              <div className="code-box" style={{ fontSize: 13 }}>
                <div><span className="cmt">call_1:</span> system_prompt (2000tk) → <span style={{ color: "#6f42c1" }}>CACHE WRITE</span></div>
                <div style={{ marginTop: 4 }}><span className="cmt">call_2:</span> system_prompt (2000tk) → <span style={{ color: "#032f62", fontWeight: 700 }}>90% OFF ✓</span></div>
                <div style={{ marginTop: 4 }}><span className="cmt">call_3:</span> system_prompt (2000tk) → <span style={{ color: "#032f62", fontWeight: 700 }}>90% OFF ✓</span></div>
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 16, paddingTop: 16 }}>
                  monthly_bill: <span style={{ fontSize: 22, fontWeight: 700 }}>$40</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE DEMO */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>LIVE DEMO</div>
          <Terminal />
        </section>

        {/* HOW IT WORKS */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>HOW IT WORKS</div>
          {[
            { n: "01", t: "ANALYZE", d: "Scans your prompt structure — identifies system instructions, tool schemas, static documents." },
            { n: "02", t: "SCORE", d: "Rates each segment by stability. Tracks content hashes across requests to detect what repeats." },
            { n: "03", t: "INJECT", d: "Places cache_control breakpoints at optimal positions. Up to 4 per request on Anthropic." },
            { n: "04", t: "TRACK", d: "Monitors cache hit rates, token counts, and calculates real dollar savings per request." },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 28, padding: "20px 0", borderBottom: i < 3 ? "1px solid #e2e8f0" : "none" }}>
              <span className="display-type" style={{ fontSize: 36, minWidth: 56, color: "#000" }}>{step.n}</span>
              <div>
                <div className="kicker" style={{ marginBottom: 6 }}>{step.t}</div>
                <p style={{ color: "#757575", fontSize: 15, lineHeight: 1.6 }}>{step.d}</p>
              </div>
            </div>
          ))}
        </section>

        {/* QUICK START */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>QUICK START</div>
          <div className="code-box" style={{ border: "2px solid #000", padding: 28 }}>
            <div className="cmt">{"// one line change to existing code"}</div>
            <div style={{ marginTop: 8 }}><span className="kw">import</span> Anthropic <span className="kw">from</span> <span className="str">&apos;@anthropic-ai/sdk&apos;</span></div>
            <div><span className="kw">import</span> {"{ optimizeAnthropic }"} <span className="kw">from</span> <span className="str">&apos;cachellm&apos;</span></div>
            <div style={{ marginTop: 20 }}><span className="cmt">{"// wrap once — everything else stays the same"}</span></div>
            <div><span className="kw">const</span> client = <span className="fn">optimizeAnthropic</span>(<span className="kw">new</span> <span className="fn">Anthropic</span>())</div>
            <div style={{ marginTop: 20 }}><span className="kw">const</span> res = <span className="kw">await</span> client.messages.<span className="fn">create</span>({"{"}</div>
            <div style={{ paddingLeft: 24 }}>model: <span className="str">&apos;claude-sonnet-4-20250514&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>system: <span className="str">&apos;You are a helpful assistant...&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>messages: [{"{ role: 'user', content: 'Hello' }"}],</div>
            <div>{"})"}</div>
            <div style={{ marginTop: 20 }}>client.<span className="fn">printStats</span>() <span className="cmt">{"// see your savings"}</span></div>
          </div>
        </section>

        {/* COST PROJECTION */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>COST PROJECTION</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["SCALE", "BEFORE", "AFTER", "SAVED"].map((h, i) => (
                  <td key={h} className="kicker-light" style={{ padding: "12px 0", textAlign: i > 0 ? "right" : "left" }}>{h}</td>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { scale: "100 req/day", before: "$9", after: "$1.35", saved: "$7.65/day" },
                { scale: "500 req/day", before: "$45", after: "$6.75", saved: "$38/day" },
                { scale: "1,000 req/day", before: "$90", after: "$13.50", saved: "$76/day" },
                { scale: "10,000 req/day", before: "$900", after: "$135", saved: "$765/day" },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px 0", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.scale}</td>
                  <td style={{ padding: "16px 0", textAlign: "right", color: "#757575", textDecoration: "line-through" }}>{r.before}</td>
                  <td style={{ padding: "16px 0", textAlign: "right", fontWeight: 700, fontSize: 17 }}>{r.after}</td>
                  <td style={{ padding: "16px 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#757575" }}>{r.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="kicker-light" style={{ marginTop: 16, fontSize: 10 }}>* CLAUDE SONNET / 3K TOKEN SYSTEM PROMPT / 90% HIT RATE</p>
        </section>

        {/* PROVIDERS */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>SUPPORTED PROVIDERS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { name: "ANTHROPIC", status: "LIVE", savings: "90%", method: "cache_control injection", ttl: "5min / 1hr" },
              { name: "OPENAI", status: "LIVE", savings: "50%", method: "prefix reordering", ttl: "5–10min" },
              { name: "GEMINI", status: "LIVE", savings: "90%", method: "cache object mgmt", ttl: "configurable" },
            ].map((p, i) => (
              <div key={i} style={{ padding: "0 28px", borderLeft: i > 0 ? "1px solid #e2e8f0" : "none", paddingLeft: i === 0 ? 0 : 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span className="kicker">{p.name}</span>
                  <span className="kicker" style={{ fontSize: 10, color: "#000" }}>● {p.status}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span className="kicker-light">SAVINGS</span><span style={{ fontWeight: 600 }}>{p.savings}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span className="kicker-light">METHOD</span><span style={{ color: "#757575" }}>{p.method}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span className="kicker-light">TTL</span><span style={{ color: "#757575" }}>{p.ttl}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>ARCHITECTURE</div>
          <div className="code-box" style={{ border: "2px solid #000", padding: 28, fontSize: 12, lineHeight: 1.8 }}>
            <pre style={{ fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit" }}>{
`YOUR APP
  │
  │  const client = optimizeAnthropic(new Anthropic())
  │
  ▼
┌─────────────────────────────────────────┐
│              cachellm                   │
│                                         │
│  ANALYZER      STRATEGY       STATS     │
│  scores        picks          tracks    │
│  segments      breakpoint     hits &    │
│  by stability  positions      savings   │
│       │             │            │      │
│       └─────────────┘            │      │
│             │                    │      │
│  ┌──────────▼────────────┐      │      │
│  │  PROVIDER ADAPTERS    │      │      │
│  │  anthropic · openai   │      │      │
│  │  gemini               │      │      │
│  └─────┬─────────┬───────┘      │      │
└────────┼─────────┼──────────────┼──────┘
         │         │              │
         ▼         ▼              ▼
┌──────────┐ ┌────────┐ ┌──────────────┐
│Claude API│ │GPT API │ │Terminal: $$$ │
│ 90% off  │ │50% off │ │   saved      │
└──────────┘ └────────┘ └──────────────┘`}</pre>
          </div>
        </section>

        {/* DESIGN PRINCIPLES */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "1px solid #e2e8f0" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>DESIGN PRINCIPLES</div>
          {[
            { k: "ZERO DEPENDENCIES", v: "No tiktoken (3MB), no Redis, no external services. Token estimation uses a fast heuristic." },
            { k: "ZERO INFRASTRUCTURE", v: "Everything runs in-process. No proxy, no database, no config. npm install and done." },
            { k: "ZERO CODE CHANGES", v: "JavaScript Proxy wraps your client. All methods, props, and TypeScript types pass through unchanged." },
            { k: "UNDER 15KB GZIPPED", v: "Smaller than most favicons." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 40, padding: "20px 0", borderBottom: i < 3 ? "1px solid #e2e8f0" : "none", alignItems: "baseline" }}>
              <span className="kicker" style={{ minWidth: 200, flexShrink: 0 }}>{p.k}</span>
              <span style={{ color: "#757575", fontSize: 15, lineHeight: 1.6 }}>{p.v}</span>
            </div>
          ))}
        </section>

        {/* ROADMAP */}
        <section style={{ paddingTop: 56, paddingBottom: 56, borderBottom: "2px solid #000" }}>
          <div className="ribbon" style={{ marginBottom: 36 }}>ROADMAP</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 15 }}>
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
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: item.done ? "#000" : "#ccc" }}>
                  {item.done ? "■" : "□"}
                </span>
                <span style={{ color: item.done ? "#1a1a1a" : "#999" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#1a1a1a", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }}>
            <div>
              <div className="kicker" style={{ color: "#fff", marginBottom: 16 }}>CACHELLM</div>
              <p style={{ color: "#757575", fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
                Auto-optimize LLM prompt caching. Zero dependencies. Zero config. MIT licensed.
              </p>
            </div>
            <div>
              <div className="kicker-light" style={{ color: "#555", marginBottom: 16 }}>LINKS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                <a href="https://github.com/sahilempire/cachellm" target="_blank" style={{ color: "#888", textDecoration: "none" }}>GitHub ↗</a>
                <a href="https://www.npmjs.com/package/cachellm" target="_blank" style={{ color: "#888", textDecoration: "none" }}>npm ↗</a>
                <a href="https://github.com/sahilempire/cachellm/issues" target="_blank" style={{ color: "#888", textDecoration: "none" }}>Issues ↗</a>
              </div>
            </div>
            <div>
              <div className="kicker-light" style={{ color: "#555", marginBottom: 16 }}>RESOURCES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                <a href="https://github.com/sahilempire/cachellm#quick-start" target="_blank" style={{ color: "#888", textDecoration: "none" }}>Documentation</a>
                <a href="https://github.com/sahilempire/cachellm/tree/main/examples" target="_blank" style={{ color: "#888", textDecoration: "none" }}>Examples</a>
                <a href="https://github.com/sahilempire/cachellm/blob/main/CONTRIBUTING.md" target="_blank" style={{ color: "#888", textDecoration: "none" }}>Contributing</a>
              </div>
            </div>
            <div>
              <div className="kicker-light" style={{ color: "#555", marginBottom: 16 }}>AUTHOR</div>
              <a href="https://github.com/sahilempire" target="_blank" style={{ color: "#888", textDecoration: "none", fontSize: 14 }}>@sahilempire</a>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #333", marginTop: 48, paddingTop: 20 }}>
            <span className="kicker-light" style={{ color: "#333", fontSize: 10 }}>MIT LICENSE — v0.2.0 — 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";

// ── responsive ──────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(1200);
  useEffect(() => {
    const update = () => setW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return { mobile: w < 640, tablet: w >= 640 && w < 1024, desktop: w >= 1024 };
}

// ── fonts ───────────────────────────────────────────────────────────
const mono = { fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace" };
const serif = { fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" };
const sans = { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" };

// ── colors ──────────────────────────────────────────────────────────
const ink = "#000";
const paper = "#fff";
const gray = "#666";
const hairline = "#d4d4d4";

// ── animated counter ────────────────────────────────────────────────
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

// ── kicker label (bordered tag) ─────────────────────────────────────
function Kicker({ children }: { children: string }) {
  return (
    <span style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: ink, border: `2px solid ${ink}`, padding: "6px 14px", display: "inline-block", marginBottom: 24 }}>
      {children}
    </span>
  );
}

// ── button styles ───────────────────────────────────────────────────
const btnOutline: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "12px 24px",
  border: `2px solid ${ink}`, borderRadius: 0, background: paper, color: ink,
  ...mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase",
  cursor: "pointer", textDecoration: "none", transition: "all 120ms",
};
const btnFilled: React.CSSProperties = {
  ...btnOutline, background: ink, color: paper,
};

// ── MAIN ────────────────────────────────────────────────────────────
export default function Home() {
  const { mobile, tablet } = useBreakpoint();
  const [copied, setCopied] = useState<string | false>(false);
  const copyNpm = () => { navigator.clipboard.writeText("npm install cachellm"); setCopied("npm"); setTimeout(() => setCopied(false), 2000); };
  const copyPip = () => { navigator.clipboard.writeText("pip install cachellm-py"); setCopied("pip"); setTimeout(() => setCopied(false), 2000); };

  const px = mobile ? 20 : 40;
  const maxW = 1100;

  return (
    <div style={{ background: paper, color: ink, minHeight: "100vh" }}>

      {/* ── NAV — thin top rule + content ── */}
      <div style={{ borderTop: `3px solid ${ink}` }} />
      <nav style={{ padding: `0 ${px}px`, borderBottom: `1px solid ${hairline}` }}>
        <div style={{ maxWidth: maxW, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
          <span style={{ ...mono, fontSize: 13, fontWeight: 700, letterSpacing: "1px" }}>CACHELLM</span>
          <div style={{ display: "flex", alignItems: "center", gap: mobile ? 16 : 28 }}>
            {[
              { label: "GITHUB", href: "https://github.com/sahilempire/cachellm" },
              { label: "NPM", href: "https://www.npmjs.com/package/cachellm" },
              { label: "PYPI", href: "https://pypi.org/project/cachellm-py/" },
              ...(!mobile ? [{ label: "DOCS", href: "https://github.com/sahilempire/cachellm#quick-start" }] : []),
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" style={{ ...mono, fontSize: 11, letterSpacing: "1px", color: ink, textDecoration: "none", transition: "opacity 120ms" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.5")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >{l.label}</a>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: maxW, margin: "0 auto", padding: `0 ${px}px` }}>

        {/* ── HERO ── */}
        <header style={{ paddingTop: mobile ? 48 : 80, paddingBottom: mobile ? 48 : 72, borderBottom: `2px solid ${ink}` }}>
          <Kicker>Open Source / Developer Tool</Kicker>
          <h1 style={{ ...serif, fontSize: mobile ? 48 : "clamp(60px, 9vw, 88px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-1px", color: ink, marginBottom: mobile ? 20 : 28 }}>
            Stop Overpaying<br />for LLM Calls.
          </h1>
          <p style={{ ...sans, fontSize: mobile ? 15 : 17, lineHeight: 1.65, color: gray, maxWidth: 520, marginBottom: mobile ? 32 : 40 }}>
            A printerly, monochrome caching layer for Anthropic, OpenAI, and Gemini. Wraps your SDK client. Injects cache breakpoints. Tracks savings. <strong style={{ color: ink }}>60–90% off your API bill.</strong>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button onClick={copyNpm} style={btnOutline}
              onMouseEnter={e => { e.currentTarget.style.background = ink; e.currentTarget.style.color = paper; }}
              onMouseLeave={e => { e.currentTarget.style.background = paper; e.currentTarget.style.color = ink; }}
            >
              npm install cachellm
              <span style={{ marginLeft: 12, opacity: 0.4, fontSize: 10 }}>{copied === "npm" ? "COPIED" : "COPY"}</span>
            </button>
            <button onClick={copyPip} style={btnFilled}
              onMouseEnter={e => { e.currentTarget.style.background = paper; e.currentTarget.style.color = ink; }}
              onMouseLeave={e => { e.currentTarget.style.background = ink; e.currentTarget.style.color = paper; }}
            >
              pip install cachellm-py
              <span style={{ marginLeft: 12, opacity: 0.4, fontSize: 10 }}>{copied === "pip" ? "COPIED" : "COPY"}</span>
            </button>
          </div>
        </header>

        {/* ── NUMBERS ── */}
        <section style={{ paddingTop: mobile ? 36 : 48, paddingBottom: mobile ? 36 : 48, borderBottom: `1px solid ${hairline}` }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: mobile ? 28 : 0 }}>
            {[
              { label: "CACHE HIT RATE", val: 90, suf: "%" },
              { label: "COST REDUCTION", val: 84, suf: "%" },
              { label: "DEPENDENCIES", val: 0, suf: "", static: true },
              { label: "GZIPPED", val: 15, suf: "KB" },
            ].map((s, i) => (
              <div key={i} style={{ paddingLeft: !mobile && i > 0 ? 28 : 0, paddingRight: !mobile && i < 3 ? 28 : 0, borderLeft: !mobile && i > 0 ? `1px solid ${hairline}` : "none" }}>
                <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: gray, marginBottom: 8 }}>{s.label}</div>
                <div style={{ ...serif, fontSize: mobile ? 38 : 48, fontWeight: 400, lineHeight: 1, color: ink }}>
                  {s.static ? "0" : <Counter end={s.val} delay={300 + i * 120} suffix={s.suf} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE PROBLEM ── */}
        <section style={{ paddingTop: mobile ? 48 : 72, paddingBottom: mobile ? 48 : 72, borderBottom: `2px solid ${ink}` }}>
          <Kicker>The Problem</Kicker>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 40 : 0 }}>
            <div style={{ paddingRight: mobile ? 0 : 40, borderRight: mobile ? "none" : `2px solid ${ink}` }}>
              <div style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: gray, marginBottom: 20 }}>WITHOUT CACHELLM</div>
              <div style={{ ...mono, fontSize: 13, lineHeight: 2.2 }}>
                <div>call 1 → system_prompt (2000tk) → <span style={{ color: "#c0392b", fontWeight: 700 }}>FULL PRICE</span></div>
                <div>call 2 → system_prompt (2000tk) → <span style={{ color: "#c0392b", fontWeight: 700 }}>FULL PRICE</span></div>
                <div>call 3 → system_prompt (2000tk) → <span style={{ color: "#c0392b", fontWeight: 700 }}>FULL PRICE</span></div>
              </div>
              <div style={{ ...serif, fontSize: 36, marginTop: 28 }}>$300<span style={{ fontSize: 18, color: gray }}>/mo</span></div>
            </div>
            <div style={{ paddingLeft: mobile ? 0 : 40 }}>
              <div style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: ink, marginBottom: 20 }}>WITH CACHELLM</div>
              <div style={{ ...mono, fontSize: 13, lineHeight: 2.2 }}>
                <div>call 1 → system_prompt (2000tk) → <span style={{ fontWeight: 700 }}>CACHE WRITE</span></div>
                <div>call 2 → system_prompt (2000tk) → <span style={{ fontWeight: 700 }}>90% OFF ✓</span></div>
                <div>call 3 → system_prompt (2000tk) → <span style={{ fontWeight: 700 }}>90% OFF ✓</span></div>
              </div>
              <div style={{ ...serif, fontSize: 36, marginTop: 28 }}>$40<span style={{ fontSize: 18, color: gray }}>/mo</span></div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ paddingTop: mobile ? 48 : 72, paddingBottom: mobile ? 48 : 72, borderBottom: `1px solid ${hairline}` }}>
          <Kicker>How It Works</Kicker>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 40 : 64 }}>
            <div>
              {[
                { n: "01", t: "ANALYZE", d: "Scans your prompt structure — system instructions, tool schemas, conversation history." },
                { n: "02", t: "SCORE", d: "Rates each segment by stability using djb2 content hashing across requests." },
                { n: "03", t: "INJECT", d: "Places cache_control breakpoints at optimal positions. Up to 4 per request." },
                { n: "04", t: "TRACK", d: "Monitors cache hit rates and calculates real dollar savings per request." },
              ].map((step, i) => (
                <div key={i} style={{ paddingBottom: 24, marginBottom: 24, borderBottom: i < 3 ? `1px solid ${hairline}` : "none", display: "flex", gap: 20 }}>
                  <span style={{ ...serif, fontSize: 32, lineHeight: 1, minWidth: 40, color: ink }}>{step.n}</span>
                  <div>
                    <div style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 6 }}>{step.t}</div>
                    <p style={{ ...sans, fontSize: 14, color: gray, lineHeight: 1.6 }}>{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...mono, fontSize: 13, lineHeight: 1.8, background: paper, border: `2px solid ${ink}`, padding: mobile ? 20 : 28, alignSelf: "start" }}>
              <div style={{ color: gray }}>{"// one line change"}</div>
              <div style={{ marginTop: 8 }}><span style={{ color: "#d73a49" }}>import</span> Anthropic <span style={{ color: "#d73a49" }}>from</span> <span style={{ color: "#032f62" }}>&apos;@anthropic-ai/sdk&apos;</span></div>
              <div><span style={{ color: "#d73a49" }}>import</span> {"{ optimizeAnthropic }"} <span style={{ color: "#d73a49" }}>from</span> <span style={{ color: "#032f62" }}>&apos;cachellm&apos;</span></div>
              <div style={{ marginTop: 20 }}><span style={{ color: "#d73a49" }}>const</span> client = <span style={{ color: "#6f42c1" }}>optimizeAnthropic</span>(<span style={{ color: "#d73a49" }}>new</span> <span style={{ color: "#6f42c1" }}>Anthropic</span>())</div>
              <div style={{ marginTop: 20 }}><span style={{ color: "#d73a49" }}>const</span> res = <span style={{ color: "#d73a49" }}>await</span> client.messages.<span style={{ color: "#6f42c1" }}>create</span>({"{"}</div>
              <div style={{ paddingLeft: 24 }}>model: <span style={{ color: "#032f62" }}>&apos;claude-sonnet-4-20250514&apos;</span>,</div>
              <div style={{ paddingLeft: 24 }}>system: <span style={{ color: "#032f62" }}>&apos;You are a helpful assistant...&apos;</span>,</div>
              <div style={{ paddingLeft: 24 }}>messages: [{"{ role: 'user', content: 'Hello' }"}],</div>
              <div>{"})"}</div>
              <div style={{ marginTop: 20 }}>client.<span style={{ color: "#6f42c1" }}>printStats</span>() <span style={{ color: gray }}>{"// see savings"}</span></div>
            </div>
          </div>
        </section>

        {/* ── PROVIDERS ── */}
        <section style={{ paddingTop: mobile ? 48 : 72, paddingBottom: mobile ? 48 : 72, borderBottom: `2px solid ${ink}` }}>
          <Kicker>Supported Providers</Kicker>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 0 }}>
            {[
              { name: "Anthropic", sub: "Claude", savings: "90%", method: "cache_control injection", ttl: "5min / 1hr" },
              { name: "OpenAI", sub: "GPT", savings: "50%", method: "Prefix reordering", ttl: "5–10min auto" },
              { name: "Google", sub: "Gemini", savings: "90%", method: "CachedContent API", ttl: "Configurable" },
            ].map((p, i) => (
              <div key={i} style={{
                padding: mobile ? "24px 0" : "28px 32px",
                paddingLeft: !mobile && i === 0 ? 0 : undefined,
                paddingRight: !mobile && i === 2 ? 0 : undefined,
                borderLeft: !mobile && i > 0 ? `2px solid ${ink}` : "none",
                borderBottom: mobile && i < 2 ? `1px solid ${hairline}` : "none",
              }}>
                <div style={{ ...serif, fontSize: 28, marginBottom: 4 }}>{p.name}</div>
                <div style={{ ...mono, fontSize: 11, letterSpacing: "1px", color: gray, marginBottom: 20 }}>{p.sub}</div>
                {[
                  { k: "SAVINGS", v: `up to ${p.savings}` },
                  { k: "METHOD", v: p.method },
                  { k: "TTL", v: p.ttl },
                ].map(row => (
                  <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${hairline}` }}>
                    <span style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: gray }}>{row.k}</span>
                    <span style={{ ...sans, fontSize: 13 }}>{row.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── COST TABLE ── */}
        <section style={{ paddingTop: mobile ? 48 : 72, paddingBottom: mobile ? 48 : 72, borderBottom: `1px solid ${hairline}` }}>
          <Kicker>Cost Projection</Kicker>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${ink}` }}>
                  {["SCALE", "BEFORE", "AFTER", "SAVED/DAY"].map((h, i) => (
                    <td key={h} style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: gray, padding: "14px 0", textAlign: i > 0 ? "right" : "left" }}>{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { scale: "100 req/day", before: "$9", after: "$1.35", saved: "$7.65" },
                  { scale: "500 req/day", before: "$45", after: "$6.75", saved: "$38.25" },
                  { scale: "1,000 req/day", before: "$90", after: "$13.50", saved: "$76.50" },
                  { scale: "10,000 req/day", before: "$900", after: "$135", saved: "$765" },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${hairline}` }}>
                    <td style={{ padding: "16px 0", ...mono, fontSize: 13 }}>{r.scale}</td>
                    <td style={{ padding: "16px 0", textAlign: "right", ...sans, color: gray, textDecoration: "line-through", fontSize: 14 }}>{r.before}</td>
                    <td style={{ padding: "16px 0", textAlign: "right", ...sans, fontWeight: 700, fontSize: 17 }}>{r.after}</td>
                    <td style={{ padding: "16px 0", textAlign: "right", ...mono, fontSize: 12, color: gray }}>{r.saved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...mono, fontSize: 10, letterSpacing: "0.5px", color: gray, marginTop: 20, opacity: 0.5 }}>Based on Claude Sonnet, 3K token system prompt, 90% cache hit rate.</p>
        </section>

        {/* ── PRINCIPLES ── */}
        <section style={{ paddingTop: mobile ? 48 : 72, paddingBottom: mobile ? 48 : 72, borderBottom: `2px solid ${ink}` }}>
          <Kicker>Design Principles</Kicker>
          {[
            { k: "Zero dependencies", v: "No tiktoken (3MB), no Redis, no external services. Token estimation uses a fast heuristic." },
            { k: "Zero infrastructure", v: "Everything runs in-process. No proxy, no database, no config files." },
            { k: "Zero code changes", v: "Wraps your existing client via Proxy. All methods, props, and types pass through." },
            { k: "Under 15KB gzipped", v: "Smaller than most favicons. Ships as ESM and CJS with full type definitions." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 8 : 40, padding: "20px 0", borderBottom: i < 3 ? `1px solid ${hairline}` : "none", alignItems: mobile ? "flex-start" : "baseline" }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", minWidth: mobile ? "auto" : 200, flexShrink: 0 }}>{p.k}</span>
              <span style={{ ...sans, color: gray, fontSize: 14, lineHeight: 1.6 }}>{p.v}</span>
            </div>
          ))}
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ padding: `0 ${px}px` }}>
        <div style={{ maxWidth: maxW, margin: "0 auto", padding: `${mobile ? 40 : 56}px 0` }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.5fr 1fr 1fr 1fr", gap: mobile ? 28 : 40, alignItems: "start" }}>
            <div>
              <div style={{ ...mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 12 }}>CACHELLM</div>
              <p style={{ ...sans, color: gray, fontSize: 13, lineHeight: 1.7 }}>
                Auto-optimize LLM prompt caching.<br />Zero dependencies. MIT licensed.
              </p>
            </div>
            {[
              { title: "LINKS", items: [{ text: "GitHub", href: "https://github.com/sahilempire/cachellm" }, { text: "npm", href: "https://www.npmjs.com/package/cachellm" }, { text: "PyPI", href: "https://pypi.org/project/cachellm-py/" }] },
              { title: "RESOURCES", items: [{ text: "Documentation", href: "https://github.com/sahilempire/cachellm#quick-start" }, { text: "Examples", href: "https://github.com/sahilempire/cachellm/tree/main/examples" }, { text: "Contributing", href: "https://github.com/sahilempire/cachellm/blob/main/CONTRIBUTING.md" }] },
              { title: "AUTHOR", items: [{ text: "@sahilempire", href: "https://github.com/sahilempire" }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: gray, marginBottom: 14 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.items.map(item => (
                    <a key={item.text} href={item.href} target="_blank" style={{ ...sans, fontSize: 13, color: gray, textDecoration: "none", transition: "color 120ms" }}
                      onMouseEnter={e => (e.currentTarget.style.color = ink)}
                      onMouseLeave={e => (e.currentTarget.style.color = gray)}
                    >{item.text}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${hairline}`, marginTop: 40, paddingTop: 16 }}>
            <span style={{ ...mono, fontSize: 10, color: gray, opacity: 0.4 }}>MIT License — v0.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

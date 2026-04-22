"use client";

import { useState, useEffect } from "react";

// ── responsive hook ─────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(1200);
  useEffect(() => {
    const update = () => setW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return { mobile: w < 640, tablet: w >= 640 && w < 1024, desktop: w >= 1024, w };
}

// ── shared inline style objects (WIRED spec) ──────────────────────────
const mono = { fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace" };
const serif = { fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif" };
const sans = { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" };
const blue = "#057dbc";

const kicker: React.CSSProperties = { ...mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.1px", textTransform: "uppercase" as const, color: "#1a1a1a", lineHeight: 1.2 };
const kickerLight: React.CSSProperties = { ...mono, fontSize: 11, fontWeight: 400, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#757575", lineHeight: 1.3 };
const display: React.CSSProperties = { ...serif, fontWeight: 400, lineHeight: 0.95, letterSpacing: "-0.5px", color: "#1a1a1a" };
const bodySerif: React.CSSProperties = { ...serif, fontSize: 19, fontWeight: 400, lineHeight: 1.47, letterSpacing: "0.1px", color: "#1a1a1a" };

// ── Counter ───────────────────────────────────────────────────────────
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

// ── Terminal ──────────────────────────────────────────────────────────
function Terminal({ mobile }: { mobile: boolean }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setS(1), 500), setTimeout(() => setS(2), 1500), setTimeout(() => setS(3), 2800), setTimeout(() => setS(4), 3600), setTimeout(() => setS(5), 4400), setTimeout(() => setS(6), 5600)];
    return () => t.forEach(clearTimeout);
  }, []);
  const codeStyle: React.CSSProperties = { ...mono, fontSize: mobile ? 11 : 13, lineHeight: 1.7, background: "#fff", border: "2px solid #000", padding: mobile ? "16px 12px" : "28px 28px", overflowX: "auto" };
  const dim: React.CSSProperties = { color: "#6a737d" };

  return (
    <div style={codeStyle}>
      {s >= 0 && <div><span style={dim}>$</span> npm install cachellm</div>}
      {s >= 1 && <div style={dim}>added 1 package in 0.8s</div>}
      {s >= 2 && <div style={{ marginTop: 16 }}><span style={dim}>$</span> node app.ts</div>}
      {s >= 3 && <div style={dim}>[cachellm] analyzing... 3 segments found</div>}
      {s >= 4 && <div style={{ ...dim, wordBreak: "break-word" }}>[cachellm] breakpoints: system(2100tk) + tools(800tk)</div>}
      {s >= 5 && <div style={{ fontWeight: 700, color: "#1a1a1a", wordBreak: "break-word" }}>[cachellm] cache hit — 2,100 tokens at 90% discount</div>}
      {s >= 6 && (
        <pre style={{ marginTop: 20, borderTop: "1px solid #e2e8f0", paddingTop: 16, ...mono, fontSize: mobile ? 10 : 13, lineHeight: 1.6, overflowX: "auto" }}>{
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

// ── Ribbon (black bar with white mono label) ─────────────────────────
function Ribbon({ children }: { children: string }) {
  return (
    <div style={{ display: "inline-block", background: "#000", color: "#fff", padding: "8px 16px", ...mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 32 }}>
      {children}
    </div>
  );
}

// ── Section wrapper with consistent spacing ──────────────────────────
function Section({ children, border = "hairline", mobile = false }: { children: React.ReactNode; border?: "hairline" | "heavy" | "none"; mobile?: boolean }) {
  const bb = border === "heavy" ? "2px solid #000" : border === "hairline" ? "1px solid #e2e8f0" : "none";
  return <section style={{ paddingTop: mobile ? 32 : 48, paddingBottom: mobile ? 32 : 48, borderBottom: bb }}>{children}</section>;
}

// ── Code block ───────────────────────────────────────────────────────
function Code({ children, heavy = false, mobile = false }: { children: React.ReactNode; heavy?: boolean; mobile?: boolean }) {
  return (
    <div style={{ ...mono, fontSize: mobile ? 11 : 13, lineHeight: 1.7, background: "#fafafa", border: heavy ? "2px solid #000" : "1px solid #e2e8f0", padding: mobile ? 16 : 24, overflowX: "auto" }}>
      {children}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────
export default function Home() {
  const { mobile, tablet, desktop } = useBreakpoint();
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText("npm install cachellm"); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const pagePadding = mobile ? "0 16px" : "0 32px";

  return (
    <>
      {/* ── BLACK UTILITY NAV BAR ── */}
      <nav style={{ background: "#000", color: "#fff", padding: mobile ? "0 16px" : "0 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 40 }}>
          <span style={{ ...mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px", color: "#fff" }}>CACHELLM</span>
          <div style={{ display: "flex", gap: mobile ? 16 : 24 }}>
            {[
              { label: "GITHUB", href: "https://github.com/sahilempire/cachellm" },
              { label: "NPM", href: "https://www.npmjs.com/package/cachellm" },
              ...(!mobile ? [{ label: "DOCS", href: "https://github.com/sahilempire/cachellm#quick-start" }] : []),
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" style={{ ...mono, fontSize: 11, letterSpacing: "1px", color: "#fff", textDecoration: "none", transition: "color 120ms" }}
                onMouseEnter={e => (e.currentTarget.style.color = blue)}
                onMouseLeave={e => (e.currentTarget.style.color = "#fff")}
              >{l.label}</a>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: pagePadding }}>

        {/* ── HERO ── */}
        <header style={{ paddingTop: mobile ? 40 : 64, paddingBottom: mobile ? 32 : 48, borderBottom: "2px solid #000" }}>
          <div style={{ ...kicker, marginBottom: 8 }}>OPEN SOURCE · NPM PACKAGE</div>
          <h1 style={{ ...display, fontSize: mobile ? 48 : "clamp(48px, 8vw, 80px)", marginBottom: 20 }}>cachellm</h1>
          <p style={{ ...bodySerif, maxWidth: 560, marginBottom: 36, fontSize: mobile ? 17 : 19 }}>
            Auto-optimize LLM prompt caching. One line of code.{" "}
            <strong>60–90% savings</strong>{" "}on your Claude &amp; GPT API bills.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button onClick={copy} style={{ display: "inline-flex", alignItems: "center", gap: mobile ? 8 : 12, padding: mobile ? "10px 16px" : "12px 24px", border: "2px solid #000", borderRadius: 0, background: "#fff", color: "#000", ...mono, fontSize: mobile ? 12 : 13, fontWeight: 700, cursor: "pointer", transition: "background 150ms, color 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
            >
              <span style={{ color: "#757575" }}>$</span>
              <span>npm install cachellm</span>
              <span style={{ color: "#999", fontSize: 10, letterSpacing: "1px", borderLeft: "1px solid #e2e8f0", paddingLeft: mobile ? 8 : 12 }}>{copied ? "COPIED" : "COPY"}</span>
            </button>
            <a href="https://github.com/sahilempire/cachellm" target="_blank" style={{ display: "inline-flex", alignItems: "center", padding: mobile ? "10px 16px" : "12px 24px", border: "2px solid #000", borderRadius: 0, background: "#fff", color: "#000", ...sans, fontSize: 14, fontWeight: 700, letterSpacing: "0.3px", textDecoration: "none", transition: "background 150ms, color 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
            >VIEW SOURCE →</a>
          </div>
        </header>

        {/* ── NUMBERS ── */}
        <Section mobile={mobile}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? 24 : 0 }}>
            {[
              { label: "CACHE HIT RATE", val: 90, suf: "%", s: false },
              { label: "COST REDUCTION", val: 84, suf: "%", s: false },
              { label: "DEPENDENCIES", val: 0, suf: "", s: true },
              { label: "BUNDLE SIZE", val: 15, suf: "KB", s: false },
            ].map((stat, i) => (
              <div key={i} style={{
                paddingRight: mobile ? 0 : 32,
                paddingLeft: mobile ? 0 : (i > 0 ? 32 : 0),
                borderLeft: mobile ? "none" : (i > 0 ? "1px solid #e2e8f0" : "none"),
                borderBottom: mobile && i < 2 ? "1px solid #e2e8f0" : "none",
                paddingBottom: mobile && i < 2 ? 24 : 0,
              }}>
                <div style={{ ...kickerLight, marginBottom: 8 }}>{stat.label}</div>
                <div style={{ ...display, fontSize: mobile ? 36 : 44 }}>
                  {stat.s ? "0" : <Counter end={stat.val} delay={400 + i * 150} suffix={stat.suf} />}
                  {stat.s && stat.suf}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── THE PROBLEM ── */}
        <Section mobile={mobile}>
          <Ribbon>THE PROBLEM</Ribbon>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1px 1fr", gap: mobile ? 32 : 0 }}>
            <div style={{ paddingRight: mobile ? 0 : 40 }}>
              <div style={{ ...kicker, color: "#757575", marginBottom: 16 }}>WITHOUT CACHELLM</div>
              <Code mobile={mobile}>
                <div><span style={{ color: "#6a737d" }}>call_1:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div style={{ marginTop: 4 }}><span style={{ color: "#6a737d" }}>call_2:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div style={{ marginTop: 4 }}><span style={{ color: "#6a737d" }}>call_3:</span> system_prompt (2000tk) → <span style={{ color: "#d73a49" }}>FULL PRICE</span></div>
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 16, paddingTop: 16 }}>
                  monthly_bill: <span style={{ fontSize: 22, fontWeight: 700, color: "#d73a49" }}>$300</span>
                </div>
              </Code>
            </div>
            {!mobile && <div style={{ background: "#000" }} />}
            <div style={{ paddingLeft: mobile ? 0 : 40 }}>
              <div style={{ ...kicker, marginBottom: 16 }}>WITH CACHELLM</div>
              <Code mobile={mobile}>
                <div><span style={{ color: "#6a737d" }}>call_1:</span> system_prompt (2000tk) → <span style={{ color: "#6f42c1" }}>CACHE WRITE</span></div>
                <div style={{ marginTop: 4 }}><span style={{ color: "#6a737d" }}>call_2:</span> system_prompt (2000tk) → <span style={{ color: "#032f62", fontWeight: 700 }}>90% OFF ✓</span></div>
                <div style={{ marginTop: 4 }}><span style={{ color: "#6a737d" }}>call_3:</span> system_prompt (2000tk) → <span style={{ color: "#032f62", fontWeight: 700 }}>90% OFF ✓</span></div>
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 16, paddingTop: 16 }}>
                  monthly_bill: <span style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>$40</span>
                </div>
              </Code>
            </div>
          </div>
        </Section>

        {/* ── LIVE DEMO ── */}
        <Section mobile={mobile}>
          <Ribbon>LIVE DEMO</Ribbon>
          <Terminal mobile={mobile} />
        </Section>

        {/* ── HOW IT WORKS ── */}
        <Section mobile={mobile}>
          <Ribbon>HOW IT WORKS</Ribbon>
          {[
            { n: "01", t: "ANALYZE", d: "Scans your prompt structure — identifies system instructions, tool schemas, static documents." },
            { n: "02", t: "SCORE", d: "Rates each segment by stability. Tracks content hashes across requests to detect what repeats." },
            { n: "03", t: "INJECT", d: "Places cache_control breakpoints at optimal positions. Up to 4 per request on Anthropic." },
            { n: "04", t: "TRACK", d: "Monitors cache hit rates, token counts, and calculates real dollar savings per request." },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: mobile ? 16 : 24, padding: "20px 0", borderBottom: i < 3 ? "1px solid #e2e8f0" : "none" }}>
              <span style={{ ...display, fontSize: mobile ? 28 : 36, minWidth: mobile ? 40 : 52, color: "#1a1a1a" }}>{step.n}</span>
              <div>
                <div style={{ ...kicker, marginBottom: 4 }}>{step.t}</div>
                <p style={{ ...sans, color: "#757575", fontSize: mobile ? 14 : 15, lineHeight: 1.6 }}>{step.d}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* ── QUICK START ── */}
        <Section mobile={mobile}>
          <Ribbon>QUICK START</Ribbon>
          <Code heavy mobile={mobile}>
            <div style={{ color: "#6a737d" }}>{"// one line change to existing code"}</div>
            <div style={{ marginTop: 8 }}><span style={{ color: "#d73a49" }}>import</span> Anthropic <span style={{ color: "#d73a49" }}>from</span> <span style={{ color: "#032f62" }}>&apos;@anthropic-ai/sdk&apos;</span></div>
            <div><span style={{ color: "#d73a49" }}>import</span> {"{ optimizeAnthropic }"} <span style={{ color: "#d73a49" }}>from</span> <span style={{ color: "#032f62" }}>&apos;cachellm&apos;</span></div>
            <div style={{ marginTop: 20, color: "#6a737d" }}>{"// wrap once — everything else stays the same"}</div>
            <div><span style={{ color: "#d73a49" }}>const</span> client = <span style={{ color: "#6f42c1" }}>optimizeAnthropic</span>(<span style={{ color: "#d73a49" }}>new</span> <span style={{ color: "#6f42c1" }}>Anthropic</span>())</div>
            <div style={{ marginTop: 20 }}><span style={{ color: "#d73a49" }}>const</span> res = <span style={{ color: "#d73a49" }}>await</span> client.messages.<span style={{ color: "#6f42c1" }}>create</span>({"{"}</div>
            <div style={{ paddingLeft: 24 }}>model: <span style={{ color: "#032f62" }}>&apos;claude-sonnet-4-20250514&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>system: <span style={{ color: "#032f62" }}>&apos;You are a helpful assistant...&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>messages: [{"{ role: 'user', content: 'Hello' }"}],</div>
            <div>{"})"}</div>
            <div style={{ marginTop: 20 }}>client.<span style={{ color: "#6f42c1" }}>printStats</span>() <span style={{ color: "#6a737d" }}>{"// see your savings"}</span></div>
          </Code>
        </Section>

        {/* ── COST PROJECTION ── */}
        <Section mobile={mobile}>
          <Ribbon>COST PROJECTION</Ribbon>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", ...sans, minWidth: mobile ? 360 : "auto" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  {["SCALE", "BEFORE", "AFTER", "SAVED/DAY"].map((h, i) => (
                    <td key={h} style={{ ...kickerLight, padding: "12px 0", textAlign: i > 0 ? "right" : "left", fontSize: mobile ? 10 : 11 }}>{h}</td>
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
                  <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: mobile ? "12px 8px 12px 0" : "16px 0", ...mono, fontSize: mobile ? 11 : 13 }}>{r.scale}</td>
                    <td style={{ padding: mobile ? "12px 0" : "16px 0", textAlign: "right", color: "#757575", textDecoration: "line-through", fontSize: mobile ? 12 : 14 }}>{r.before}</td>
                    <td style={{ padding: mobile ? "12px 0" : "16px 0", textAlign: "right", fontWeight: 700, fontSize: mobile ? 15 : 17 }}>{r.after}</td>
                    <td style={{ padding: mobile ? "12px 0" : "16px 0", textAlign: "right", ...mono, fontSize: mobile ? 10 : 12, color: "#757575" }}>{r.saved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...kickerLight, fontSize: 10, marginTop: 16 }}>* CLAUDE SONNET · 3K TOKEN SYSTEM PROMPT · 90% HIT RATE</p>
        </Section>

        {/* ── PROVIDERS ── */}
        <Section mobile={mobile}>
          <Ribbon>SUPPORTED PROVIDERS</Ribbon>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: mobile ? 0 : 0 }}>
            {[
              { name: "ANTHROPIC", savings: "90%", method: "cache_control injection", ttl: "5min / 1hr" },
              { name: "OPENAI", savings: "50%", method: "prefix reordering", ttl: "5–10min" },
              { name: "GEMINI", savings: "90%", method: "cache object mgmt", ttl: "configurable" },
            ].map((p, i) => (
              <div key={i} style={{
                paddingRight: mobile ? 0 : 28,
                paddingLeft: mobile ? 0 : (i > 0 ? 28 : 0),
                borderLeft: mobile ? "none" : (i > 0 ? "1px solid #000" : "none"),
                borderBottom: mobile && i < 2 ? "1px solid #e2e8f0" : "none",
                paddingTop: mobile && i > 0 ? 20 : 0,
                paddingBottom: mobile && i < 2 ? 20 : 0,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={kicker}>{p.name}</span>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: "#1a1a1a" }}>● LIVE</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { k: "SAVINGS", v: p.savings, bold: true },
                    { k: "METHOD", v: p.method, bold: false },
                    { k: "TTL", v: p.ttl, bold: false },
                  ].map(row => (
                    <div key={row.k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={kickerLight}>{row.k}</span>
                      <span style={{ ...sans, fontWeight: row.bold ? 600 : 400, color: row.bold ? "#1a1a1a" : "#757575" }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── ARCHITECTURE ── */}
        <Section mobile={mobile}>
          <Ribbon>ARCHITECTURE</Ribbon>
          <div style={{ border: "2px solid #000", background: "#fff", padding: mobile ? "20px 14px" : "32px 28px" }}>
            {/* YOUR APP */}
            <div style={{ border: "1px solid #e2e8f0", padding: mobile ? "12px 14px" : "16px 20px", marginBottom: 0 }}>
              <div style={{ ...kicker, marginBottom: 8 }}>YOUR APP</div>
              <div style={{ ...mono, fontSize: mobile ? 11 : 13, color: "#6a737d", overflowX: "auto" }}>
                const client = <span style={{ color: "#6f42c1" }}>optimizeAnthropic</span>(<span style={{ color: "#d73a49" }}>new</span> Anthropic())
              </div>
            </div>

            {/* Arrow down */}
            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
              <div style={{ width: 2, height: 20, background: "#000" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
              <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #000" }} />
            </div>

            {/* CACHELLM box */}
            <div style={{ border: "2px solid #000", padding: mobile ? "16px 12px" : "24px 20px" }}>
              <div style={{ ...kicker, fontSize: 14, marginBottom: mobile ? 14 : 20 }}>CACHELLM</div>

              {/* Three columns: Analyzer, Strategy, Stats */}
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: mobile ? 8 : 12, marginBottom: mobile ? 14 : 20 }}>
                {[
                  { title: "ANALYZER", lines: ["Scores segments by stability"] },
                  { title: "STRATEGY", lines: ["Picks breakpoint positions"] },
                  { title: "STATS", lines: ["Tracks hits & savings"] },
                ].map((col, i) => (
                  <div key={i} style={{ background: "#fafafa", border: "1px solid #e2e8f0", padding: mobile ? "10px 12px" : "14px 16px", display: "flex", alignItems: mobile ? "center" : "flex-start", gap: mobile ? 12 : 0, flexDirection: mobile ? "row" : "column" }}>
                    <div style={{ ...kicker, fontSize: 11, marginBottom: mobile ? 0 : 6, minWidth: mobile ? 80 : "auto", flexShrink: 0 }}>{col.title}</div>
                    <div style={{ ...sans, fontSize: 13, color: "#757575", lineHeight: 1.5 }}>{col.lines[0]}</div>
                  </div>
                ))}
              </div>

              {/* Arrow down into Provider Adapters */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
                <div style={{ width: 2, height: 12, background: "#000" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
                <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid #000" }} />
              </div>

              {/* Provider Adapters */}
              <div style={{ border: "1px solid #000", padding: mobile ? "10px 12px" : "14px 16px", marginTop: 0 }}>
                <div style={{ ...kicker, fontSize: 11, marginBottom: 8 }}>PROVIDER ADAPTERS</div>
                <div style={{ display: "flex", gap: mobile ? 12 : 16, ...mono, fontSize: 12, color: "#757575", flexWrap: "wrap" }}>
                  <span>anthropic</span>
                  <span style={{ color: "#e2e8f0" }}>|</span>
                  <span>openai</span>
                  <span style={{ color: "#e2e8f0" }}>|</span>
                  <span>gemini</span>
                </div>
              </div>
            </div>

            {/* Three arrows down */}
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: mobile ? 0 : 12 }}>
              {(mobile ? [0] : [0, 1, 2]).map(i => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 2, height: 16, background: "#000" }} />
                  <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid #000" }} />
                </div>
              ))}
            </div>

            {/* Three output boxes */}
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: mobile ? 8 : 12 }}>
              {[
                { title: "CLAUDE API", detail: "90% off cached tokens" },
                { title: "GPT API", detail: "50% off cached tokens" },
                { title: "DASHBOARD", detail: "Real-time cost savings" },
              ].map((box, i) => (
                <div key={i} style={{ background: "#000", color: "#fff", padding: mobile ? "10px 14px" : "14px 16px", display: "flex", flexDirection: mobile ? "row" : "column", justifyContent: mobile ? "space-between" : "flex-start", alignItems: mobile ? "center" : "flex-start", gap: mobile ? 8 : 0 }}>
                  <div style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: "1px", marginBottom: mobile ? 0 : 4 }}>{box.title}</div>
                  <div style={{ ...sans, fontSize: 12, color: "#999" }}>{box.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── DESIGN PRINCIPLES ── */}
        <Section mobile={mobile}>
          <Ribbon>DESIGN PRINCIPLES</Ribbon>
          {[
            { k: "ZERO DEPENDENCIES", v: "No tiktoken (3MB), no Redis, no external services. Token estimation uses a fast heuristic." },
            { k: "ZERO INFRASTRUCTURE", v: "Everything runs in-process. No proxy, no database, no config. npm install and done." },
            { k: "ZERO CODE CHANGES", v: "JavaScript Proxy wraps your client. All methods, props, and TypeScript types pass through." },
            { k: "UNDER 15KB GZIPPED", v: "Smaller than most favicons." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 8 : 40, padding: "20px 0", borderBottom: i < 3 ? "1px solid #e2e8f0" : "none", alignItems: mobile ? "flex-start" : "baseline" }}>
              <span style={{ ...kicker, minWidth: mobile ? "auto" : 200, flexShrink: 0 }}>{p.k}</span>
              <span style={{ ...sans, color: "#757575", fontSize: mobile ? 14 : 15, lineHeight: 1.6 }}>{p.v}</span>
            </div>
          ))}
        </Section>

        {/* ── bottom rule before footer ── */}
        <div style={{ borderBottom: "2px solid #000" }} />
      </main>

      {/* ── FOOTER (inverted) ── */}
      <footer style={{ background: "#1a1a1a", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "40px 16px" : "56px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : tablet ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: mobile ? 32 : 40 }}>
            <div>
              <div style={{ ...kicker, color: "#fff", marginBottom: 12 }}>CACHELLM</div>
              <p style={{ ...sans, color: "#757575", fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
                Auto-optimize LLM prompt caching. Zero dependencies. Zero config. MIT licensed.
              </p>
            </div>
            {[
              { title: "LINKS", items: [{ text: "GitHub ↗", href: "https://github.com/sahilempire/cachellm" }, { text: "npm ↗", href: "https://www.npmjs.com/package/cachellm" }, { text: "Issues ↗", href: "https://github.com/sahilempire/cachellm/issues" }] },
              { title: "RESOURCES", items: [{ text: "Documentation", href: "https://github.com/sahilempire/cachellm#quick-start" }, { text: "Examples", href: "https://github.com/sahilempire/cachellm/tree/main/examples" }, { text: "Contributing", href: "https://github.com/sahilempire/cachellm/blob/main/CONTRIBUTING.md" }] },
              { title: "AUTHOR", items: [{ text: "@sahilempire", href: "https://github.com/sahilempire" }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ ...kickerLight, color: "#555", marginBottom: 12 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, ...sans, fontSize: 14 }}>
                  {col.items.map(item => (
                    <a key={item.text} href={item.href} target="_blank" style={{ color: "#888", textDecoration: "none", transition: "color 120ms" }}
                      onMouseEnter={e => (e.currentTarget.style.color = blue)}
                      onMouseLeave={e => (e.currentTarget.style.color = "#888")}
                    >{item.text}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #333", marginTop: 40, paddingTop: 16 }}>
            <span style={{ ...kickerLight, color: "#333", fontSize: 10 }}>MIT LICENSE — V0.2.0 — 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}

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

// ── colors ──────────────────────────────────────────────────────────
const bg = "#0a0a0c";
const surface = "#141418";
const surfaceHover = "#1c1c22";
const border = "#27272a";
const text = "#e4e4e7";
const textMuted = "#71717a";
const accent = "#8b5cf6";
const accentGlow = "rgba(139, 92, 246, 0.15)";

// ── fonts ───────────────────────────────────────────────────────────
const mono = { fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace" };
const sans = { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" };

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

// ── MAIN ────────────────────────────────────────────────────────────
export default function Home() {
  const { mobile, tablet } = useBreakpoint();
  const [copied, setCopied] = useState<string | false>(false);
  const copyNpm = () => { navigator.clipboard.writeText("npm install cachellm"); setCopied("npm"); setTimeout(() => setCopied(false), 2000); };
  const copyPip = () => { navigator.clipboard.writeText("pip install cachellm-py"); setCopied("pip"); setTimeout(() => setCopied(false), 2000); };

  const px = mobile ? 20 : 32;
  const maxW = 1080;

  return (
    <div style={{ background: bg, color: text, minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10, 10, 12, 0.8)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: maxW, margin: "0 auto", padding: `0 ${px}px`, display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <span style={{ ...sans, fontSize: 15, fontWeight: 700, color: text, letterSpacing: "-0.3px" }}>cachellm</span>
          <div style={{ display: "flex", alignItems: "center", gap: mobile ? 16 : 28 }}>
            {[
              { label: "Docs", href: "https://github.com/sahilempire/cachellm#quick-start" },
              { label: "GitHub", href: "https://github.com/sahilempire/cachellm" },
              ...(!mobile ? [
                { label: "npm", href: "https://www.npmjs.com/package/cachellm" },
                { label: "PyPI", href: "https://pypi.org/project/cachellm-py/" },
              ] : []),
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" style={{ ...sans, fontSize: 14, color: textMuted, textDecoration: "none", transition: "color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.color = text)}
                onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
              >{l.label}</a>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: maxW, margin: "0 auto", padding: `0 ${px}px` }}>

        {/* ── HERO ── */}
        <header style={{ paddingTop: mobile ? 60 : 120, paddingBottom: mobile ? 60 : 100, textAlign: "center" }}>
          <div style={{ ...mono, fontSize: 12, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 20 }}>Open Source / TypeScript + Python</div>
          <h1 style={{ ...sans, fontSize: mobile ? 36 : "clamp(48px, 7vw, 72px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#fff", marginBottom: 20 }}>
            Stop Overpaying<br />for LLM Calls.
          </h1>
          <p style={{ ...sans, fontSize: mobile ? 16 : 18, lineHeight: 1.7, color: textMuted, maxWidth: 560, margin: "0 auto", marginBottom: 40 }}>
            Wraps your Anthropic, OpenAI, or Gemini SDK client. Analyzes prompt stability. Injects cache breakpoints automatically. <span style={{ color: text }}>Cuts API costs 60–90%.</span>
          </p>

          {/* install commands */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            {[
              { cmd: "npm install cachellm", key: "npm", fn: copyNpm },
              { cmd: "pip install cachellm-py", key: "pip", fn: copyPip },
            ].map(btn => (
              <button key={btn.key} onClick={btn.fn} style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "10px 20px", background: surface, border: `1px solid ${border}`,
                borderRadius: 8, color: text, ...mono, fontSize: 13, cursor: "pointer",
                transition: "all 150ms",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 20px ${accentGlow}`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span style={{ color: textMuted }}>$</span>
                {btn.cmd}
                <span style={{ color: textMuted, fontSize: 10, marginLeft: 4 }}>{copied === btn.key ? "COPIED" : "COPY"}</span>
              </button>
            ))}
          </div>

          <a href="https://github.com/sahilempire/cachellm" target="_blank" style={{
            ...sans, fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none",
            background: accent, padding: "10px 28px", borderRadius: 8, display: "inline-block",
            transition: "all 150ms",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.boxShadow = `0 0 30px ${accentGlow}`; }}
            onMouseLeave={e => { e.currentTarget.style.background = accent; e.currentTarget.style.boxShadow = "none"; }}
          >View on GitHub</a>
        </header>

        {/* ── STATS ── */}
        <section style={{ paddingBottom: mobile ? 48 : 80 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? 16 : 20 }}>
            {[
              { label: "Cache Hit Rate", val: 90, suf: "%" },
              { label: "Cost Reduction", val: 84, suf: "%" },
              { label: "Dependencies", val: 0, suf: "", static: true },
              { label: "Gzipped", val: 15, suf: "KB" },
            ].map((s, i) => (
              <div key={i} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: mobile ? 20 : 24, textAlign: "center" }}>
                <div style={{ ...mono, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: textMuted, marginBottom: 8 }}>{s.label}</div>
                <div style={{ ...sans, fontSize: mobile ? 32 : 40, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                  {s.static ? "0" : <Counter end={s.val} delay={300 + i * 120} suffix={s.suf} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ paddingBottom: mobile ? 48 : 80 }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 32 : 48 }}>
            <div style={{ ...mono, fontSize: 12, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>How It Works</div>
            <h2 style={{ ...sans, fontSize: mobile ? 28 : 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>Four steps. Zero config.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {[
              { icon: "01", t: "Analyze", d: "Scans your prompt structure — system instructions, tool schemas, conversation history." },
              { icon: "02", t: "Score", d: "Rates each segment by stability using djb2 content hashing across requests." },
              { icon: "03", t: "Inject", d: "Places cache_control breakpoints at optimal positions. Up to 4 per request on Anthropic." },
              { icon: "04", t: "Track", d: "Monitors cache hit rates, token counts, and calculates real dollar savings per request." },
            ].map((f, i) => (
              <div key={i} style={{
                background: surface, border: `1px solid ${border}`, borderRadius: 12,
                padding: mobile ? 24 : 28, transition: "all 150ms",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3f3f46"; (e.currentTarget as HTMLElement).style.background = surfaceHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.background = surface; }}
              >
                <div style={{ ...mono, fontSize: 11, color: accent, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ ...sans, fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{f.t}</div>
                <p style={{ ...sans, fontSize: 14, color: textMuted, lineHeight: 1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CODE EXAMPLE ── */}
        <section style={{ paddingBottom: mobile ? 48 : 80 }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 32 : 48 }}>
            <div style={{ ...mono, fontSize: 12, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>Quick Start</div>
            <h2 style={{ ...sans, fontSize: mobile ? 28 : 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>One line change.</h2>
          </div>
          <div style={{
            background: surface, border: `1px solid ${border}`, borderRadius: 12,
            padding: mobile ? 20 : 32, ...mono, fontSize: mobile ? 12 : 14, lineHeight: 1.8,
            overflowX: "auto",
          }}>
            <div style={{ color: textMuted }}>{"// wrap your existing client — that's it"}</div>
            <div style={{ marginTop: 8 }}><span style={{ color: "#c084fc" }}>import</span> Anthropic <span style={{ color: "#c084fc" }}>from</span> <span style={{ color: "#34d399" }}>&apos;@anthropic-ai/sdk&apos;</span></div>
            <div><span style={{ color: "#c084fc" }}>import</span> {"{ optimizeAnthropic }"} <span style={{ color: "#c084fc" }}>from</span> <span style={{ color: "#34d399" }}>&apos;cachellm&apos;</span></div>
            <div style={{ marginTop: 20 }}><span style={{ color: "#c084fc" }}>const</span> <span style={{ color: text }}>client</span> = <span style={{ color: "#60a5fa" }}>optimizeAnthropic</span>(<span style={{ color: "#c084fc" }}>new</span> <span style={{ color: "#60a5fa" }}>Anthropic</span>())</div>
            <div style={{ marginTop: 20 }}><span style={{ color: "#c084fc" }}>const</span> res = <span style={{ color: "#c084fc" }}>await</span> client.messages.<span style={{ color: "#60a5fa" }}>create</span>({"{"}</div>
            <div style={{ paddingLeft: 24 }}>model: <span style={{ color: "#34d399" }}>&apos;claude-sonnet-4-20250514&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>system: <span style={{ color: "#34d399" }}>&apos;You are a helpful assistant...&apos;</span>,</div>
            <div style={{ paddingLeft: 24 }}>messages: [{"{ role: 'user', content: 'Hello' }"}],</div>
            <div>{"})"}</div>
            <div style={{ marginTop: 20 }}>client.<span style={{ color: "#60a5fa" }}>printStats</span>() <span style={{ color: textMuted }}>{"// see your savings"}</span></div>
          </div>
        </section>

        {/* ── BEFORE / AFTER ── */}
        <section style={{ paddingBottom: mobile ? 48 : 80 }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 32 : 48 }}>
            <div style={{ ...mono, fontSize: 12, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>The Difference</div>
            <h2 style={{ ...sans, fontSize: mobile ? 28 : 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>$900/mo to $135/mo.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: mobile ? 24 : 32 }}>
              <div style={{ ...mono, fontSize: 11, color: "#f87171", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>Without cachellm</div>
              <div style={{ ...mono, fontSize: 13, lineHeight: 2.2, color: textMuted }}>
                <div>call 1 → system (2000tk) → <span style={{ color: "#f87171" }}>full price</span></div>
                <div>call 2 → system (2000tk) → <span style={{ color: "#f87171" }}>full price</span></div>
                <div>call 3 → system (2000tk) → <span style={{ color: "#f87171" }}>full price</span></div>
              </div>
              <div style={{ ...sans, fontSize: 32, fontWeight: 800, color: "#f87171", marginTop: 24 }}>$300<span style={{ fontSize: 16, fontWeight: 400, color: textMuted }}>/mo</span></div>
            </div>
            <div style={{ background: surface, border: `1px solid ${accent}`, borderRadius: 12, padding: mobile ? 24 : 32, boxShadow: `0 0 40px ${accentGlow}` }}>
              <div style={{ ...mono, fontSize: 11, color: accent, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>With cachellm</div>
              <div style={{ ...mono, fontSize: 13, lineHeight: 2.2, color: textMuted }}>
                <div>call 1 → system (2000tk) → <span style={{ color: accent }}>cache write</span></div>
                <div>call 2 → system (2000tk) → <span style={{ color: "#34d399", fontWeight: 600 }}>90% off</span></div>
                <div>call 3 → system (2000tk) → <span style={{ color: "#34d399", fontWeight: 600 }}>90% off</span></div>
              </div>
              <div style={{ ...sans, fontSize: 32, fontWeight: 800, color: "#fff", marginTop: 24 }}>$40<span style={{ fontSize: 16, fontWeight: 400, color: textMuted }}>/mo</span></div>
            </div>
          </div>
        </section>

        {/* ── PROVIDERS ── */}
        <section style={{ paddingBottom: mobile ? 48 : 80 }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 32 : 48 }}>
            <div style={{ ...mono, fontSize: 12, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>Providers</div>
            <h2 style={{ ...sans, fontSize: mobile ? 28 : 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>Works with everything.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
            {[
              { name: "Anthropic", sub: "Claude", savings: "90%", method: "cache_control injection", ttl: "5min / 1hr" },
              { name: "OpenAI", sub: "GPT", savings: "50%", method: "Prefix reordering", ttl: "5–10min auto" },
              { name: "Google", sub: "Gemini", savings: "90%", method: "CachedContent API", ttl: "Configurable" },
            ].map((p, i) => (
              <div key={i} style={{
                background: surface, border: `1px solid ${border}`, borderRadius: 12,
                padding: mobile ? 24 : 28, transition: "all 150ms",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3f3f46"; (e.currentTarget as HTMLElement).style.background = surfaceHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.background = surface; }}
              >
                <div style={{ ...sans, fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{p.name}</div>
                <div style={{ ...mono, fontSize: 11, color: textMuted, marginBottom: 20 }}>{p.sub}</div>
                {[
                  { k: "Savings", v: `up to ${p.savings}` },
                  { k: "Method", v: p.method },
                  { k: "TTL", v: p.ttl },
                ].map(row => (
                  <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${border}` }}>
                    <span style={{ ...mono, fontSize: 11, color: textMuted }}>{row.k}</span>
                    <span style={{ ...sans, fontSize: 13, color: text }}>{row.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── COST TABLE ── */}
        <section style={{ paddingBottom: mobile ? 48 : 80 }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 32 : 48 }}>
            <div style={{ ...mono, fontSize: 12, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>Savings</div>
            <h2 style={{ ...sans, fontSize: mobile ? 28 : 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>Cost at scale.</h2>
          </div>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: mobile ? 16 : 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Scale", "Before", "After", "Saved/day"].map((h, i) => (
                    <td key={h} style={{ ...mono, fontSize: 11, color: textMuted, padding: mobile ? "12px 8px" : "16px 24px", textAlign: i > 0 ? "right" : "left" }}>{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { scale: "100 req/day", before: "$9", after: "$1.35", saved: "$7.65" },
                  { scale: "500 req/day", before: "$45", after: "$6.75", saved: "$38.25" },
                  { scale: "1K req/day", before: "$90", after: "$13.50", saved: "$76.50" },
                  { scale: "10K req/day", before: "$900", after: "$135", saved: "$765" },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: i < 3 ? `1px solid ${border}` : "none" }}>
                    <td style={{ padding: mobile ? "12px 8px" : "16px 24px", ...mono, fontSize: 13, color: text }}>{r.scale}</td>
                    <td style={{ padding: mobile ? "12px 8px" : "16px 24px", textAlign: "right", ...sans, color: textMuted, textDecoration: "line-through", fontSize: 14 }}>{r.before}</td>
                    <td style={{ padding: mobile ? "12px 8px" : "16px 24px", textAlign: "right", ...sans, fontWeight: 700, fontSize: 16, color: "#fff" }}>{r.after}</td>
                    <td style={{ padding: mobile ? "12px 8px" : "16px 24px", textAlign: "right", ...mono, fontSize: 12, color: "#34d399" }}>{r.saved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...mono, fontSize: 10, color: textMuted, marginTop: 16, textAlign: "center", opacity: 0.5 }}>Based on Claude Sonnet, 3K token system prompt, 90% cache hit rate.</p>
        </section>

        {/* ── PRINCIPLES ── */}
        <section style={{ paddingBottom: mobile ? 48 : 80 }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 32 : 48 }}>
            <div style={{ ...mono, fontSize: 12, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>Philosophy</div>
            <h2 style={{ ...sans, fontSize: mobile ? 28 : 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>Built different.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {[
              { k: "Zero dependencies", v: "No tiktoken (3MB), no Redis, no external services. Fast heuristic token estimation." },
              { k: "Zero infrastructure", v: "Everything runs in-process. No proxy, no database, no config files needed." },
              { k: "Zero code changes", v: "Wraps your existing client via Proxy. All methods, props, and types pass through." },
              { k: "Under 15KB gzipped", v: "Smaller than most favicons. Ships as ESM and CJS with full type definitions." },
            ].map((p, i) => (
              <div key={i} style={{
                background: surface, border: `1px solid ${border}`, borderRadius: 12,
                padding: mobile ? 24 : 28,
              }}>
                <div style={{ ...sans, fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{p.k}</div>
                <p style={{ ...sans, fontSize: 14, color: textMuted, lineHeight: 1.6 }}>{p.v}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: maxW, margin: "0 auto", padding: `${mobile ? 40 : 56}px ${px}px` }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.5fr 1fr 1fr 1fr", gap: mobile ? 28 : 40, alignItems: "start" }}>
            <div>
              <div style={{ ...sans, fontSize: 15, fontWeight: 700, color: text, marginBottom: 12 }}>cachellm</div>
              <p style={{ ...sans, color: textMuted, fontSize: 13, lineHeight: 1.7 }}>
                Auto-optimize LLM prompt caching.<br />Zero dependencies. MIT licensed.
              </p>
            </div>
            {[
              { title: "Links", items: [{ text: "GitHub", href: "https://github.com/sahilempire/cachellm" }, { text: "npm", href: "https://www.npmjs.com/package/cachellm" }, { text: "PyPI", href: "https://pypi.org/project/cachellm-py/" }] },
              { title: "Resources", items: [{ text: "Documentation", href: "https://github.com/sahilempire/cachellm#quick-start" }, { text: "Examples", href: "https://github.com/sahilempire/cachellm/tree/main/examples" }, { text: "Contributing", href: "https://github.com/sahilempire/cachellm/blob/main/CONTRIBUTING.md" }] },
              { title: "Author", items: [{ text: "@sahilempire", href: "https://github.com/sahilempire" }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ ...sans, fontSize: 12, fontWeight: 600, color: textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.items.map(item => (
                    <a key={item.text} href={item.href} target="_blank" style={{ ...sans, fontSize: 13, color: textMuted, textDecoration: "none", transition: "color 150ms" }}
                      onMouseEnter={e => (e.currentTarget.style.color = text)}
                      onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
                    >{item.text}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${border}`, marginTop: 40, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ ...sans, fontSize: 12, color: textMuted, opacity: 0.5 }}>MIT License</span>
            <span style={{ ...sans, fontSize: 12, color: textMuted, opacity: 0.5 }}>v0.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

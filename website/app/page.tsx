"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   WAVEFORM CANVAS — glowing sine wave like a radar display
   ═══════════════════════════════════════════════════════════ */
function Waveform({ height = 80, color = "#00ffaa" }: { height?: number; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offset = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);

      const w = canvas.offsetWidth;
      const h = height;

      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      for (let x = 0; x < w; x++) {
        const y = h / 2 +
          Math.sin((x * 0.02) + offset.current) * (h * 0.25) +
          Math.sin((x * 0.005) + offset.current * 0.5) * (h * 0.15) +
          Math.sin((x * 0.05) + offset.current * 2) * (h * 0.05);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // dim fill under curve
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = color.replace(")", ",0.05)").replace("rgb", "rgba");
      ctx.shadowBlur = 0;
      ctx.fill();

      offset.current += 0.03;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [height, color]);

  return <canvas ref={canvasRef} className="w-full" style={{ height }} />;
}

/* ═══════════════════════════════════════════════════════════
   RADAR — rotating sweep
   ═══════════════════════════════════════════════════════════ */
function Radar({ size = 120 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* rings */}
      <div className="absolute inset-0 rounded-full border border-[rgba(0,255,170,0.1)]" />
      <div className="absolute inset-[15%] rounded-full border border-[rgba(0,255,170,0.08)]" />
      <div className="absolute inset-[30%] rounded-full border border-[rgba(0,255,170,0.06)]" />
      {/* crosshair */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[rgba(0,255,170,0.08)]" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-[rgba(0,255,170,0.08)]" />
      {/* sweep */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, rgba(0,255,170,0.3) 8%, transparent 12%)",
          animation: "radarSweep 4s linear infinite",
        }}
      />
      {/* center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00ffaa]" style={{ boxShadow: "0 0 8px #00ffaa" }} />
      {/* blips */}
      <div className="absolute top-[25%] left-[60%] w-1 h-1 rounded-full bg-[#00ffaa] opacity-60" style={{ animation: "blink 2s infinite" }} />
      <div className="absolute top-[65%] left-[30%] w-1 h-1 rounded-full bg-[#00ffaa] opacity-40" style={{ animation: "blink 3s infinite 1s" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TYPEWRITER
   ═══════════════════════════════════════════════════════════ */
function TypeWriter({ text, speed = 50, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started || displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [displayed, text, speed, started]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-[7px] h-[15px] bg-[#00ffaa] ml-[2px] align-middle" style={{ animation: "blink 0.7s infinite" }} />
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   COUNTER
   ═══════════════════════════════════════════════════════════ */
function Counter({ end, delay = 0, suffix = "" }: { end: number; delay?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const steps = 50;
    const inc = end / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(cur));
    }, 30);
    return () => clearInterval(timer);
  }, [end, started]);

  return <span>{val}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════
   TERMINAL DEMO — animated step-by-step
   ═══════════════════════════════════════════════════════════ */
function TerminalDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 3000),
      setTimeout(() => setStep(4), 3800),
      setTimeout(() => setStep(5), 4600),
      setTimeout(() => setStep(6), 5800),
      setTimeout(() => setStep(7), 7200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="hud-panel p-5 text-[11px] leading-relaxed">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(0,255,170,0.1)]">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[rgba(0,255,170,0.3)] text-[10px]">SYSTEM TERMINAL v2.1</span>
      </div>

      {step >= 0 && <div className="animate-fade-up"><span className="text-[rgba(0,255,170,0.4)]">~$</span> <span className="glow-text">npm install</span> cachellm</div>}
      {step >= 1 && <div className="animate-fade-up text-[#444] mt-1">+ cachellm@0.1.2 added 1 package in 0.8s</div>}
      {step >= 2 && <div className="mt-3 animate-fade-up"><span className="text-[rgba(0,255,170,0.4)]">~$</span> <span className="glow-text">node</span> app.ts</div>}
      {step >= 3 && <div className="animate-fade-up text-[#444] mt-1">[cachellm] analyzing prompt structure... 3 segments detected</div>}
      {step >= 4 && <div className="animate-fade-up text-[#444]">[cachellm] breakpoints: system_prompt(2100tk) + tools(800tk)</div>}
      {step >= 5 && <div className="animate-fade-up glow-text mt-1">[cachellm] ✓ cache hit — 2,100 tokens at 90% discount</div>}
      {step >= 6 && (
        <div className="mt-4 animate-fade-up">
          <div className="text-[rgba(0,255,170,0.2)]">┌─────────────────────────────────────────┐</div>
          <div className="text-[rgba(0,255,170,0.2)]">│ <span className="hud-label">CACHE PERFORMANCE REPORT</span>                │</div>
          <div className="text-[rgba(0,255,170,0.2)]">├─────────────────────────────────────────┤</div>
          <div>│  requests     <span className="text-white">48</span>                        │</div>
          <div>│  cache_hits   <span className="glow-text">42</span> <span className="text-[#444]">(87.5%)</span>                 │</div>
          <div>│  tokens_saved <span className="text-white">284,200</span>                   │</div>
          <div>│  cost_saved   <span className="glow-text">$2.14</span> <span className="text-[#444]">(84.3%)</span>              │</div>
          <div className="text-[rgba(0,255,170,0.2)]">└─────────────────────────────────────────┘</div>
        </div>
      )}
      {step >= 7 && (
        <div className="mt-3 animate-fade-up">
          <span className="text-[rgba(0,255,170,0.4)]">~$</span>{" "}
          <span className="inline-block w-[7px] h-[13px] bg-[rgba(0,255,170,0.5)]" style={{ animation: "blink 1s infinite" }} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText("npm install cachellm");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Background effects */}
      <div className="grid-bg" />
      <div className="scanline" />

      <main className="relative z-10 max-w-[900px] mx-auto px-6 py-20">

        {/* ═══════ NAV BAR ═══════ */}
        <nav className="flex items-center justify-between mb-20 animate-fade-up text-[11px]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#00ffaa] rounded-full" style={{ boxShadow: "0 0 8px #00ffaa" }} />
            <span className="hud-label">cachellm</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/sahilempire/cachellm" target="_blank" className="text-[#555] hover:text-[#00ffaa] transition-colors">GITHUB</a>
            <a href="https://www.npmjs.com/package/cachellm" target="_blank" className="text-[#555] hover:text-[#00ffaa] transition-colors">NPM</a>
            <a href="https://github.com/sahilempire/cachellm#quick-start" target="_blank" className="text-[#555] hover:text-[#00ffaa] transition-colors">DOCS</a>
          </div>
        </nav>

        {/* ═══════ HERO ═══════ */}
        <header className="mb-24">
          <div className="hud-label mb-4 animate-fade-up">// SYSTEM ONLINE ─────────────────────────────</div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 animate-fade-up delay-1">
            <span className="glow-text"><TypeWriter text="cachellm" speed={100} /></span>
          </h1>

          <p className="text-[14px] text-[#666] mb-2 max-w-xl animate-fade-up delay-3">
            Auto-optimize LLM prompt caching.
          </p>
          <p className="text-[14px] text-[#888] mb-10 max-w-xl animate-fade-up delay-4">
            One line of code. <span className="glow-text-orange">60-90% savings</span> on Claude &amp; GPT API bills.
            <br />Zero dependencies. Zero config. Zero code changes.
          </p>

          <div className="flex flex-wrap gap-3 animate-fade-up delay-5">
            <button
              onClick={copy}
              className="hud-panel px-5 py-3 text-[12px] hover:border-[rgba(0,255,170,0.4)] transition-all cursor-pointer flex items-center gap-3 group"
            >
              <span className="text-[rgba(0,255,170,0.4)]">$</span>
              <span className="group-hover:glow-text transition-all">npm install cachellm</span>
              <span className="text-[9px] text-[#333] ml-2 tracking-widest">{copied ? "COPIED" : "COPY"}</span>
            </button>

            <a href="https://github.com/sahilempire/cachellm" target="_blank" className="hud-panel px-5 py-3 text-[12px] hover:border-[rgba(0,255,170,0.4)] transition-all flex items-center gap-2">
              VIEW SOURCE ↗
            </a>
          </div>

          <div className="hud-label mt-10 animate-fade-up delay-6">──────────────────────────────────────────────</div>
        </header>

        {/* ═══════ STATS DASHBOARD ═══════ */}
        <section className="mb-24 animate-fade-up delay-6">
          <div className="hud-label mb-4">## PERFORMANCE_METRICS</div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { label: "CACHE HIT RATE", value: 90, suffix: "%", color: "glow-text" },
              { label: "COST REDUCTION", value: 84, suffix: "%", color: "glow-text" },
              { label: "ZERO DEPS", value: 0, suffix: "KB", color: "text-white", static: true },
              { label: "BUNDLE SIZE", value: 15, suffix: "KB", color: "text-white" },
            ].map((stat, i) => (
              <div key={i} className="hud-panel p-5 text-center corner-brackets">
                <div className="hud-label mb-3">{stat.label}</div>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.static ? `${stat.value}` : <Counter end={stat.value} delay={800 + i * 200} suffix={stat.suffix} />}
                  {stat.static && stat.suffix}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ WAVEFORM + RADAR ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## SIGNAL_MONITOR</div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-0">
            <div className="hud-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="hud-label">TOKEN SAVINGS WAVEFORM</span>
                <span className="text-[9px] text-[rgba(0,255,170,0.3)]">LIVE</span>
              </div>
              <Waveform height={90} />
            </div>
            <div className="hud-panel p-4 flex flex-col items-center justify-center">
              <span className="hud-label mb-3">CACHE STATUS</span>
              <Radar size={100} />
            </div>
          </div>
        </section>

        {/* ═══════ PROBLEM ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## THREAT_ANALYSIS</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="hud-panel p-6">
              <div className="hud-label mb-4 text-red-400/50">UNOPTIMIZED SYSTEM</div>
              <div className="space-y-3 text-[12px]">
                <div className="flex justify-between"><span className="text-[#444]">call_001</span><span className="text-red-400">2000tk → FULL PRICE</span></div>
                <div className="flex justify-between"><span className="text-[#444]">call_002</span><span className="text-red-400">2000tk → FULL PRICE</span></div>
                <div className="flex justify-between"><span className="text-[#444]">call_003</span><span className="text-red-400">2000tk → FULL PRICE</span></div>
                <div className="pt-3 mt-3 border-t border-[rgba(255,100,100,0.1)]">
                  <div className="flex justify-between"><span className="text-[#444]">monthly_cost</span><span className="text-red-400 font-bold text-lg">$300</span></div>
                </div>
              </div>
            </div>

            <div className="hud-panel p-6">
              <div className="hud-label mb-4" style={{ color: "rgba(0,255,170,0.5)" }}>CACHELLM OPTIMIZED</div>
              <div className="space-y-3 text-[12px]">
                <div className="flex justify-between"><span className="text-[#444]">call_001</span><span className="text-orange-400">2000tk → CACHE WRITE</span></div>
                <div className="flex justify-between"><span className="text-[#444]">call_002</span><span className="glow-text">2000tk → 90% OFF ✓</span></div>
                <div className="flex justify-between"><span className="text-[#444]">call_003</span><span className="glow-text">2000tk → 90% OFF ✓</span></div>
                <div className="pt-3 mt-3 border-t border-[rgba(0,255,170,0.1)]">
                  <div className="flex justify-between"><span className="text-[#444]">monthly_cost</span><span className="glow-text font-bold text-lg">$40</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ TERMINAL DEMO ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## LIVE_TERMINAL</div>
          <TerminalDemo />
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## OPERATION_SEQUENCE</div>

          <div className="space-y-0">
            {[
              { num: "01", title: "ANALYZE", desc: "scans prompt structure — identifies system instructions, tool schemas, static documents" },
              { num: "02", title: "SCORE", desc: "rates each segment by stability — tracks content hashes across requests to detect patterns" },
              { num: "03", title: "INJECT", desc: "places cache_control breakpoints at optimal positions — up to 4 per request on anthropic" },
              { num: "04", title: "TRACK", desc: "monitors cache hit rates, token counts, and calculates real dollar savings per request" },
            ].map((step, i) => (
              <div key={i} className="hud-panel p-4 flex items-start gap-5">
                <span className="glow-text font-bold text-lg w-8 shrink-0">{step.num}</span>
                <div>
                  <span className="text-white font-bold text-[13px]">{step.title}</span>
                  <span className="text-[#444] ml-3 text-[12px]">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ COST CHART ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## COST_PROJECTION</div>

          <div className="hud-panel p-6">
            {[
              { label: "100 req/day", before: 9, after: 1.35, pct: 85 },
              { label: "500 req/day", before: 45, after: 6.75, pct: 85 },
              { label: "1K req/day", before: 90, after: 13.5, pct: 85 },
              { label: "10K req/day", before: 900, after: 135, pct: 85 },
            ].map((tier, i) => (
              <div key={i} className="flex items-center gap-4 mb-4 last:mb-0">
                <span className="text-[#444] text-[11px] w-[90px] shrink-0 text-right">{tier.label}</span>
                <div className="flex-1 h-6 bg-[rgba(0,255,170,0.03)] border border-[rgba(0,255,170,0.06)] relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[rgba(0,255,170,0.15)] border-r border-[rgba(0,255,170,0.4)]"
                    style={{ width: `${tier.pct}%`, transition: "width 1.5s ease-out", transitionDelay: `${i * 200}ms` }}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                    <span className="text-[10px] text-[rgba(0,255,170,0.6)]">${tier.before} → <span className="glow-text font-bold">${tier.after}</span></span>
                  </div>
                </div>
                <span className="text-[#444] text-[10px] w-[70px]">save ${(tier.before - tier.after).toFixed(0)}/day</span>
              </div>
            ))}
            <div className="text-[9px] text-[#222] mt-4">* claude sonnet / 3K token system prompt / 90% hit rate</div>
          </div>
        </section>

        {/* ═══════ PROVIDERS ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## SUPPORTED_TARGETS</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { name: "ANTHROPIC", status: "ONLINE", savings: "90%", method: "cache_control injection", ttl: "5min / 1hr" },
              { name: "OPENAI", status: "ONLINE", savings: "50%", method: "prefix reordering", ttl: "5-10min" },
              { name: "GEMINI", status: "PENDING", savings: "90%", method: "cache object mgmt", ttl: "configurable" },
            ].map((p, i) => (
              <div key={i} className="hud-panel p-5 corner-brackets">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold text-[13px]">{p.name}</span>
                  <span className={`text-[9px] tracking-widest ${p.status === "ONLINE" ? "glow-text" : "text-[#555]"}`}>
                    {p.status === "ONLINE" && "● "}{p.status}
                  </span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between"><span className="text-[#333]">savings</span><span className="glow-text">{p.savings}</span></div>
                  <div className="flex justify-between"><span className="text-[#333]">method</span><span className="text-[#666]">{p.method}</span></div>
                  <div className="flex justify-between"><span className="text-[#333]">ttl</span><span className="text-[#666]">{p.ttl}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ QUICK START CODE ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## INITIALIZATION_SEQUENCE</div>

          <div className="hud-panel p-6 text-[12px] leading-relaxed">
            <div className="text-[#333]">// one line change to existing code</div>
            <div className="mt-2"><span className="text-orange-400">import</span> Anthropic <span className="text-orange-400">from</span> <span className="glow-text">{`'@anthropic-ai/sdk'`}</span></div>
            <div><span className="text-orange-400">import</span> {"{ optimizeAnthropic }"} <span className="text-orange-400">from</span> <span className="glow-text">{`'cachellm'`}</span></div>
            <div className="mt-3"><span className="text-[#333]">// wrap once — everything else stays the same</span></div>
            <div><span className="text-orange-400">const</span> client = <span className="text-yellow-300">optimizeAnthropic</span>(<span className="text-orange-400">new</span> <span className="text-yellow-300">Anthropic</span>())</div>
            <div className="mt-3"><span className="text-orange-400">const</span> res = <span className="text-orange-400">await</span> client.messages.<span className="text-yellow-300">create</span>({`({`}</div>
            <div className="pl-4">model: <span className="glow-text">{`'claude-sonnet-4-20250514'`}</span>,</div>
            <div className="pl-4">system: <span className="glow-text">{`'You are a helpful assistant...'`}</span>,</div>
            <div className="pl-4">messages: [{`{ role: 'user', content: 'Hello' }`}],</div>
            <div>{`})`}</div>
            <div className="mt-3">client.<span className="text-yellow-300">printStats</span>() <span className="text-[#333]">// see your savings</span></div>
          </div>
        </section>

        {/* ═══════ DESIGN PRINCIPLES ═══════ */}
        <section className="mb-24">
          <div className="hud-label mb-4">## SYSTEM_SPECIFICATIONS</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {[
              { key: "DEPENDENCIES", val: "ZERO", desc: "no tiktoken, no redis, no external services" },
              { key: "INFRASTRUCTURE", val: "ZERO", desc: "in-process only, no proxy or database" },
              { key: "CODE_CHANGES", val: "ZERO", desc: "JS proxy, all types pass through unchanged" },
              { key: "BUNDLE_SIZE", val: "<15KB", desc: "gzipped, smaller than most favicons" },
            ].map((s, i) => (
              <div key={i} className="hud-panel p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="hud-label">{s.key}</span>
                  <span className="glow-text font-bold">{s.val}</span>
                </div>
                <span className="text-[#333] text-[11px]">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="border-t border-[rgba(0,255,170,0.08)] pt-10">
          <div className="hud-label mb-6">────────────────────────────────────────────────────</div>

          <div className="flex flex-wrap gap-12 text-[11px] mb-10">
            <div>
              <div className="hud-label mb-2">NAVIGATION</div>
              <div className="space-y-1.5">
                <div><a href="https://github.com/sahilempire/cachellm" target="_blank" className="text-[#444] hover:glow-text transition-colors">github ↗</a></div>
                <div><a href="https://www.npmjs.com/package/cachellm" target="_blank" className="text-[#444] hover:glow-text transition-colors">npm ↗</a></div>
                <div><a href="https://github.com/sahilempire/cachellm/issues" target="_blank" className="text-[#444] hover:glow-text transition-colors">issues ↗</a></div>
              </div>
            </div>
            <div>
              <div className="hud-label mb-2">RESOURCES</div>
              <div className="space-y-1.5">
                <div><a href="https://github.com/sahilempire/cachellm#quick-start" target="_blank" className="text-[#444] hover:glow-text transition-colors">documentation</a></div>
                <div><a href="https://github.com/sahilempire/cachellm/tree/main/examples" target="_blank" className="text-[#444] hover:glow-text transition-colors">examples</a></div>
                <div><a href="https://github.com/sahilempire/cachellm/blob/main/CONTRIBUTING.md" target="_blank" className="text-[#444] hover:glow-text transition-colors">contributing</a></div>
              </div>
            </div>
            <div>
              <div className="hud-label mb-2">AUTHOR</div>
              <div className="space-y-1.5">
                <div><a href="https://github.com/sahilempire" target="_blank" className="text-[#444] hover:glow-text transition-colors">@sahilempire</a></div>
              </div>
            </div>
          </div>

          <div className="text-[#1a1a1a] text-[10px] pb-10">
            ── MIT LICENSE ── v0.1.2 ── {new Date().getFullYear()} ──────────────────────────────────
          </div>
        </footer>
      </main>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Activity, Sparkles, TrendingUp, LineChart } from "lucide-react";
import { api } from "@/lib/api";
import { fmtPrice } from "@/lib/format";

/* ─────────── Ticker ring (DFM/ADX stocks in place of crypto coins) ─────────── */

type RingTicker = { symbol: string; name: string; grad: string };

const RING_TICKERS: RingTicker[] = [
  { symbol: "EMAAR", name: "Emaar Properties", grad: "linear-gradient(135deg,#2dd4bf,#0ea5a0)" },
  { symbol: "ENBD", name: "Emirates NBD", grad: "linear-gradient(135deg,#a78bfa,#7c5cf0)" },
  { symbol: "DIB", name: "Dubai Islamic Bank", grad: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { symbol: "DEWA", name: "Dubai Electricity & Water", grad: "linear-gradient(135deg,#38bdf8,#0284c7)" },
  { symbol: "SALIK", name: "Salik", grad: "linear-gradient(135deg,#fb7185,#e11d48)" },
  { symbol: "MASQ", name: "Mashreq Bank", grad: "linear-gradient(135deg,#34d399,#059669)" },
];

function TickerRing() {
  return (
    <div className="coin-stage" aria-hidden>
      <div className="coin-orbit-glow" />
      <div className="coin-ring">
        {RING_TICKERS.map((t, i) => {
          const angle = (360 / RING_TICKERS.length) * i;
          return (
            <div key={t.symbol} className="coin-slot" style={{ transform: `rotateY(${angle}deg) translateZ(230px)` }}>
              <div className="coin-img-wrap" style={{ ["--coin-glow" as string]: "#2dd4bf" } as React.CSSProperties}>
                <div className="ticker-badge" style={{ background: t.grad }}>
                  <span className="ticker-badge-sym">{t.symbol}</span>
                  <span className="ticker-badge-tag">DFM</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="coin-reflection" />
    </div>
  );
}

/* ─────────── Animated stock trend lines background ─────────── */

function TrendBackdrop() {
  const width = 1600;
  const height = 900;

  const { areaPath, linePath, candles, ema } = useMemo(() => {
    const rng = mulberry32(11);
    const steps = 80;
    const closes: number[] = [];
    let y = height * 0.55;
    for (let i = 0; i <= steps; i++) {
      const wave = Math.sin(i / 6) * 18 + Math.sin(i / 14 + 1.2) * 30 - i * 1.4;
      y += (rng() - 0.5) * 30 + wave * 0.06;
      y = Math.max(height * 0.15, Math.min(height * 0.85, y));
      closes.push(y);
    }
    const px = (i: number) => (width / steps) * i;

    let d = `M ${px(0)} ${closes[0]}`;
    for (let i = 1; i < closes.length; i++) {
      const x0 = px(i - 1);
      const x1 = px(i);
      const y0 = closes[i - 1];
      const y1 = closes[i];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    const area = `${d} L ${width} ${height} L 0 ${height} Z`;

    const candleList: { x: number; o: number; c: number; h: number; l: number; up: boolean }[] = [];
    for (let i = 4; i < closes.length; i += 3) {
      const o = closes[i - 3];
      const c = closes[i];
      const wick = 10 + rng() * 22;
      const h = Math.min(o, c) - wick;
      const l = Math.max(o, c) + wick * 0.8;
      candleList.push({ x: px(i), o, c, h, l, up: c < o });
    }

    const emaVals: number[] = [];
    const k = 2 / (14 + 1);
    closes.forEach((v, i) => {
      emaVals.push(i === 0 ? v : v * k + emaVals[i - 1] * (1 - k));
    });
    let emaPath = `M ${px(0)} ${emaVals[0]}`;
    for (let i = 1; i < emaVals.length; i++) {
      const x0 = px(i - 1);
      const x1 = px(i);
      const cx = (x0 + x1) / 2;
      emaPath += ` C ${cx} ${emaVals[i - 1]}, ${cx} ${emaVals[i]}, ${x1} ${emaVals[i]}`;
    }

    return { areaPath: area, linePath: d, candles: candleList, ema: emaPath };
  }, []);

  return (
    <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#2dd4bf" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="emaStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="grid-lines">
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={`v${i}`} x1={(width / 24) * i} x2={(width / 24) * i} y1={0} y2={height} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1={0} x2={width} y1={(height / 12) * i} y2={(height / 12) * i} />
        ))}
      </g>

      <path d={areaPath} fill="url(#areaFill)" className="trend-area" />

      <g className="candles">
        {candles.map((c, i) => (
          <g key={i} opacity={0.55}>
            <line x1={c.x} x2={c.x} y1={c.h} y2={c.l} stroke={c.up ? "#2dd4bf" : "#fb7185"} strokeWidth={1} />
            <rect x={c.x - 4} y={Math.min(c.o, c.c)} width={8} height={Math.max(2, Math.abs(c.c - c.o))} fill={c.up ? "#2dd4bf" : "#fb7185"} rx={1} />
          </g>
        ))}
      </g>

      <path d={ema} fill="none" stroke="url(#emaStroke)" strokeWidth={1.4} strokeDasharray="4 6" className="trend-ema" opacity={0.85} />

      <path d={linePath} fill="none" stroke="url(#lineStroke)" strokeWidth={2.4} strokeLinecap="round" filter="url(#softGlow)" className="trend-line-main" />

      <rect className="trend-sweep" x={0} y={0} width={width} height={height} />
    </svg>
  );
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─────────── Live ticker tape (real prices from our own API) ─────────── */

type Tick = { sym: string; name: string; price: number | null; exchange: string };

function LiveTicker() {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const tickers = await api.listTickers();
        const results = await Promise.allSettled(tickers.map((t) => api.getPrice(t.ticker)));
        if (cancelled) return;
        setTicks(
          tickers.map((t, i) => {
            const r = results[i];
            const price = r.status === "fulfilled" ? r.value.price : null;
            return { sym: t.ticker.split(".")[0], name: t.name, price, exchange: t.exchange };
          })
        );
      } catch {
        // Backend unreachable — landing page still renders, just without live prices.
      }
    }

    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const display = ticks.length ? ticks : RING_TICKERS.map((t) => ({ sym: t.symbol, name: t.name, price: null, exchange: "DFM" }));
  const stream = [...display, ...display];

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {stream.map((t, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-sym">{t.sym}</span>
            <span className="ticker-price">{t.price !== null ? fmtPrice(t.price) : "—"}</span>
            <span className="ticker-exchange">{t.exchange}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Landing ─────────── */

export default function Landing() {
  return (
    <>
      <style>{CSS}</style>
      <main className="landing">
        <div className="glow glow-a" />
        <div className="glow glow-b" />
        <div className="glow glow-c" />
        <TrendBackdrop />

        <nav className="nav">
          <div className="brand">
            <span className="brand-mark">◈</span>
            <span className="brand-name">DFM SIGNALS</span>
            <span className="brand-tag">UAE markets terminal</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#assets">Assets</a>
            <Link href="/dashboard" className="nav-cta">
              Launch dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-copy">
            <div className="chip">
              <span className="chip-dot" />
              Live feed · auto-refreshing every 30s
            </div>
            <h1>
              Predict the next move
              <span className="grad"> across DFM &amp; ADX equities.</span>
            </h1>
            <p className="lede">
              DFM Signals streams price action for Dubai Financial Market and Abu Dhabi
              Exchange stocks, scores every session with an RNN + Random Forest + Gradient
              Boosting + XGBoost ensemble, and prints ATR-backed take-profit and stop-loss
              levels in real time.
            </p>
            <div className="cta-row">
              <Link href="/dashboard" className="cta-primary">
                Open live terminal <ArrowRight size={16} />
              </Link>
              <a href="#features" className="cta-ghost">
                See how it works
              </a>
            </div>

            <div className="stat-row">
              <div className="stat">
                <div className="stat-k">10</div>
                <div className="stat-l">DFM &amp; ADX stocks</div>
              </div>
              <div className="stat">
                <div className="stat-k">4</div>
                <div className="stat-l">Model ensemble</div>
              </div>
              <div className="stat">
                <div className="stat-k">ATR</div>
                <div className="stat-l">TP / SL engine</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <TickerRing />
            <div className="orbit-caption">
              <Sparkles size={12} />
              Multi-asset intelligence, one terminal
            </div>
          </div>
        </section>

        <LiveTicker />

        <section id="features" className="features">
          <FeatureCard
            title="Signal ensemble"
            body="A Vanilla RNN, Random Forest, Gradient Boosting and XGBoost vote together, with underperforming models automatically excluded."
            spark="#2dd4bf"
            icon={<Activity size={16} />}
            tag="Signals"
          />
          <FeatureCard
            title="ATR risk levels"
            body="Volatility-scaled take-profit and stop-loss, printed the moment a signal turns from HOLD to BUY or SELL, with live TP/SL tracking."
            spark="#f59e0b"
            icon={<TrendingUp size={16} />}
            tag="Execution"
          />
          <FeatureCard
            title="Full DFM & ADX coverage"
            body="Emaar, Emirates NBD, DIB, du, DEWA, Salik, Mashreq auto-fetch live from Yahoo Finance; FAB, Aldar and ADCB via CSV upload."
            spark="#a78bfa"
            icon={<LineChart size={16} />}
            tag="Coverage"
          />
        </section>

        <footer id="assets" className="footer">
          <span>© DFM Signals · Research only, not financial advice.</span>
          <Link href="/dashboard" className="footer-cta">
            Launch dashboard <ArrowRight size={12} />
          </Link>
        </footer>
      </main>
    </>
  );
}

function FeatureCard({
  title,
  body,
  spark,
  icon,
  tag,
}: {
  title: string;
  body: string;
  spark: string;
  icon: React.ReactNode;
  tag: string;
}) {
  return (
    <div className="feature">
      <div className="feature-head">
        <span className="feature-tag" style={{ color: spark }}>
          {icon} {tag}
        </span>
        <MiniSpark color={spark} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function MiniSpark({ color = "#2dd4bf" }: { color?: string }) {
  // Deterministic flat line for the SSR/initial-hydration render — Math.random()
  // here would differ between server and client and trigger a hydration mismatch.
  // Real jitter only starts once mounted, client-side, in the rAF loop below.
  const [pts, setPts] = useState<number[]>(() => Array.from({ length: 40 }, () => 50));
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 120) {
        setPts((p) => {
          const next = [...p.slice(1), p[p.length - 1] + (Math.random() - 0.5) * 8];
          return next.map((v) => Math.max(10, Math.min(90, v)));
        });
        last = now;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const w = 120;
  const h = 40;
  const d = pts.map((y, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * w} ${(y / 100) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} stroke={color} strokeWidth={1.5} fill="none" />
    </svg>
  );
}

/* ─────────── Styles ─────────── */

const CSS = `
.landing {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #e2e8f0;
  background:
    radial-gradient(circle at 12% 8%, rgba(45,212,191,0.14), transparent 42%),
    radial-gradient(circle at 88% 15%, rgba(167,139,250,0.10), transparent 45%),
    radial-gradient(circle at 50% 100%, rgba(245,158,11,0.09), transparent 50%),
    #05060d;
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
}

.glow {
  position: absolute; border-radius: 50%; filter: blur(120px);
  pointer-events: none; z-index: 0;
}
.glow-a { width: 520px; height: 520px; background: rgba(45,212,191,0.22); top: -140px; left: -120px; }
.glow-b { width: 460px; height: 460px; background: rgba(167,139,250,0.18); top: 40%; right: -140px; }
.glow-c { width: 380px; height: 380px; background: rgba(245,158,11,0.14); bottom: -160px; left: 30%; }

.trend-svg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  z-index: 0; opacity: 0.85;
  mask-image: linear-gradient(180deg, transparent 0%, black 22%, black 78%, transparent 100%);
}
.grid-lines line { stroke: rgba(148,163,184,0.045); stroke-width: 1; }
.trend-area { animation: pulseFill 9s ease-in-out infinite; }
.trend-line-main {
  stroke-dasharray: 2200;
  stroke-dashoffset: 2200;
  animation: drawLine 6s ease-out forwards, pulseGlow 5s ease-in-out infinite 6s;
}
.trend-ema { animation: emaDrift 22s linear infinite; }
.candles g { animation: fadeUp 1.2s ease-out both; }
.candles g:nth-child(3n) { animation-delay: .2s; }
.candles g:nth-child(3n+1) { animation-delay: .4s; }

.trend-sweep {
  fill: url(#lineStroke);
  opacity: 0;
  mix-blend-mode: screen;
  animation: sweep 9s ease-in-out infinite;
}

@keyframes drawLine { to { stroke-dashoffset: 0; } }
@keyframes pulseGlow {
  0%,100% { filter: url(#softGlow) drop-shadow(0 0 6px rgba(94,234,212,0.3)); }
  50%     { filter: url(#softGlow) drop-shadow(0 0 14px rgba(94,234,212,0.55)); }
}
@keyframes emaDrift { to { stroke-dashoffset: -400; } }
@keyframes pulseFill { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 0.55; transform: translateY(0); } }
@keyframes sweep {
  0%   { opacity: 0; transform: translateX(-40%); }
  50%  { opacity: 0.08; }
  100% { opacity: 0; transform: translateX(40%); }
}

.nav {
  position: relative; z-index: 5;
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 44px;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark {
  width: 30px; height: 30px; display: grid; place-items: center;
  border-radius: 8px; color: #05060d;
  background: linear-gradient(135deg, #2dd4bf, #a78bfa);
  font-weight: 800;
}
.brand-name { font-weight: 800; letter-spacing: 0.14em; }
.brand-tag { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.2em; margin-left: 6px; }
.nav-links { display: flex; align-items: center; gap: 26px; }
.nav-links a { color: #94a3b8; font-size: 13px; text-decoration: none; transition: color .2s; }
.nav-links a:hover { color: #e2e8f0; }
.nav-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 999px;
  background: linear-gradient(135deg, rgba(45,212,191,0.2), rgba(167,139,250,0.2));
  border: 1px solid rgba(45,212,191,0.4);
  color: #ecfeff !important;
  font-size: 13px; font-weight: 600;
}

.hero {
  position: relative; z-index: 4;
  display: grid; grid-template-columns: 1.05fr 1fr;
  gap: 40px; align-items: center;
  padding: 40px 60px 80px;
  max-width: 1400px; margin: 0 auto;
}
@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; padding: 20px 24px 60px; }
  .nav { padding: 18px 20px; }
  .nav-links a:not(.nav-cta) { display: none; }
}

.chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(45,212,191,0.08);
  border: 1px solid rgba(45,212,191,0.25);
  color: #5eead4; font-size: 12px; font-weight: 500;
}
.chip-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #2dd4bf;
  box-shadow: 0 0 0 0 rgba(45,212,191,0.6);
  animation: pulseDot 1.8s ease-out infinite;
}
@keyframes pulseDot {
  0%,100% { box-shadow: 0 0 0 0 rgba(45,212,191,0.55); }
  50% { box-shadow: 0 0 0 8px rgba(45,212,191,0); }
}

.hero h1 {
  font-size: clamp(38px, 5vw, 62px);
  line-height: 1.02; font-weight: 800; letter-spacing: -0.02em;
  margin: 18px 0 18px;
}
.grad {
  background: linear-gradient(90deg, #2dd4bf 0%, #a78bfa 55%, #f59e0b 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.lede { color: #94a3b8; font-size: 16px; max-width: 540px; line-height: 1.6; }

.cta-row { display: flex; gap: 12px; margin-top: 26px; flex-wrap: wrap; }
.cta-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 20px; border-radius: 12px;
  background: linear-gradient(135deg, #2dd4bf, #a78bfa);
  color: #05060d; font-weight: 700; text-decoration: none;
  box-shadow: 0 12px 40px -12px rgba(45,212,191,0.6);
  transition: transform .18s ease;
}
.cta-primary:hover { transform: translateY(-1px); }
.cta-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 12px 18px; border-radius: 12px;
  border: 1px solid rgba(148,163,184,0.25);
  color: #cbd5e1; text-decoration: none; font-weight: 500;
  transition: background .18s;
}
.cta-ghost:hover { background: rgba(148,163,184,0.08); }

.stat-row { display: flex; gap: 40px; margin-top: 40px; }
.stat-k {
  font-size: 26px; font-weight: 700;
  background: linear-gradient(180deg, #ecfeff, #94a3b8);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.stat-l { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.16em; }

.hero-visual { position: relative; display: grid; place-items: center; min-height: 540px; }
.coin-stage {
  perspective: 1600px;
  width: 560px; max-width: 100%; aspect-ratio: 1;
  display: grid; place-items: center;
  position: relative;
}
.coin-orbit-glow {
  position: absolute; inset: 15%;
  border-radius: 50%;
  background:
    radial-gradient(closest-side, rgba(94,234,212,0.22), transparent 70%),
    radial-gradient(closest-side at 70% 40%, rgba(167,139,250,0.18), transparent 65%);
  filter: blur(28px);
  pointer-events: none;
  animation: orbitPulse 6s ease-in-out infinite;
}
@keyframes orbitPulse {
  0%,100% { opacity: 0.7; transform: scale(1); }
  50%     { opacity: 1;   transform: scale(1.05); }
}
.coin-reflection {
  position: absolute; bottom: 12%; left: 50%;
  transform: translateX(-50%);
  width: 60%; height: 24px;
  background: radial-gradient(ellipse at center, rgba(94,234,212,0.35), transparent 70%);
  filter: blur(18px);
  pointer-events: none;
}
.coin-ring {
  position: relative; width: 300px; height: 300px;
  transform-style: preserve-3d;
  animation: spin 24s linear infinite;
  transform: rotateX(64deg);
}
@keyframes spin {
  from { transform: rotateX(64deg) rotateY(0deg); }
  to   { transform: rotateX(64deg) rotateY(360deg); }
}
.coin-slot {
  position: absolute; inset: 0; margin: auto;
  width: 140px; height: 140px;
  transform-style: preserve-3d;
}
.coin-img-wrap {
  position: relative;
  width: 140px; height: 140px;
  transform: rotateX(-64deg);
  animation: bob 5s ease-in-out infinite;
  filter: drop-shadow(0 18px 22px rgba(0,0,0,0.55));
}
.coin-slot:nth-child(2n) .coin-img-wrap { animation-delay: -1.4s; }
.coin-slot:nth-child(3n) .coin-img-wrap { animation-delay: -2.6s; }
.coin-slot:nth-child(5n) .coin-img-wrap { animation-delay: -3.4s; }
@keyframes bob {
  0%,100% { transform: rotateX(-64deg) translateY(0); }
  50%     { transform: rotateX(-64deg) translateY(-14px); }
}

.ticker-badge {
  width: 100%; height: 100%;
  border-radius: 20px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px;
  box-shadow: 0 0 30px -6px rgba(45,212,191,0.5), inset 0 1px 0 rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.18);
}
.ticker-badge-sym { font-weight: 800; font-size: 20px; color: #05060d; letter-spacing: 0.02em; }
.ticker-badge-tag { font-size: 9px; font-weight: 700; color: rgba(5,6,13,0.65); letter-spacing: 0.18em; text-transform: uppercase; }

.orbit-caption {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; color: #94a3b8; letter-spacing: 0.12em; text-transform: uppercase;
}

.ticker-wrap {
  position: relative; z-index: 4;
  border-top: 1px solid rgba(148,163,184,0.12);
  border-bottom: 1px solid rgba(148,163,184,0.12);
  background: rgba(5,6,13,0.6); backdrop-filter: blur(10px);
  overflow: hidden;
}
.ticker-track {
  display: flex; gap: 44px; padding: 14px 0;
  white-space: nowrap;
  animation: scroll 60s linear infinite;
}
@keyframes scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.ticker-item { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; }
.ticker-sym { color: #cbd5e1; font-weight: 700; letter-spacing: 0.06em; }
.ticker-price { color: #e2e8f0; font-variant-numeric: tabular-nums; }
.ticker-exchange { color: #5eead4; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; }

.features {
  position: relative; z-index: 3;
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 20px; padding: 60px; max-width: 1400px; margin: 0 auto;
}
@media (max-width: 900px) { .features { grid-template-columns: 1fr; padding: 40px 24px; } }

.feature {
  padding: 22px; border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(148,163,184,0.14);
  backdrop-filter: blur(14px);
}
.feature-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.feature-tag {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700;
}
.feature h3 { font-size: 18px; font-weight: 700; margin: 0 0 6px; color: #ecfeff; }
.feature p { font-size: 13px; color: #94a3b8; line-height: 1.55; margin: 0; }

.footer {
  position: relative; z-index: 3;
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 44px; border-top: 1px solid rgba(148,163,184,0.1);
  color: #64748b; font-size: 12px;
}
.footer-cta {
  display: inline-flex; align-items: center; gap: 6px;
  color: #5eead4; text-decoration: none; font-weight: 600;
}
`;

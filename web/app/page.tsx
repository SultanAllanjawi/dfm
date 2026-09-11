"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  LineChart,
  TrendingUp,
  Cpu,
  Brain,
  GitBranch,
  Zap,
  Database,
  Scale,
  Filter,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { fmtPrice } from "@/lib/format";

/* ─────────── Real prices, fetched once and shared by every section below ─────────── */

type RealTicker = {
  ticker: string;
  symbol: string;
  name: string;
  exchange: string;
  price: number | null;
  changePct: number | null;
};

function useRealTickers(): RealTicker[] {
  const [rows, setRows] = useState<RealTicker[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const tickers = await api.listTickers();
        const results = await Promise.allSettled(
          tickers.map(async (t) => {
            const [priceRes, ohlcvRes] = await Promise.allSettled([api.getPrice(t.ticker), api.getOhlcv(t.ticker, 2)]);
            const price = priceRes.status === "fulfilled" ? priceRes.value.price : null;
            let changePct: number | null = null;
            if (ohlcvRes.status === "fulfilled" && ohlcvRes.value.bars.length >= 2) {
              const bars = ohlcvRes.value.bars;
              const prev = bars[bars.length - 2].close;
              const last = price ?? bars[bars.length - 1].close;
              if (prev) changePct = ((last - prev) / prev) * 100;
            }
            return {
              ticker: t.ticker,
              symbol: t.ticker.split(".")[0],
              name: t.name,
              exchange: t.exchange,
              price,
              changePct,
            };
          })
        );
        if (cancelled) return;
        setRows(
          results.map((r, i) =>
            r.status === "fulfilled"
              ? r.value
              : {
                  ticker: tickers[i].ticker,
                  symbol: tickers[i].ticker.split(".")[0],
                  name: tickers[i].name,
                  exchange: tickers[i].exchange,
                  price: null,
                  changePct: null,
                }
          )
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

  return rows;
}

// Sparkline generator — deterministic per-symbol tiny series, decorative only.
function spark(seed: number, trend: number) {
  const pts: number[] = [];
  let v = 50;
  for (let i = 0; i < 24; i++) {
    const n = Math.sin(seed + i * 0.7) * 6 + Math.cos(seed * 1.7 + i * 0.31) * 4;
    v += n * 0.35 + trend * 0.6;
    pts.push(v);
  }
  return pts;
}

/* ─────────── Landing ─────────── */

export default function Landing() {
  return (
    <div
      className="min-h-screen text-slate-100 relative overflow-x-clip"
      style={{ background: "radial-gradient(1200px 700px at 15% 0%, #0d3d3a 0%, #071a1e 45%, #04080d 100%)" }}
    >
      <BackgroundChart />

      {/* NAV */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rotate-45 rounded-md bg-gradient-to-br from-emerald-300 to-emerald-500 shadow-[0_0_20px_rgba(64,220,180,0.5)]" />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-widest">DFM SIGNALS</div>
            <div className="text-[10px] tracking-[0.25em] text-slate-400">UAE MARKETS TERMINAL</div>
          </div>
        </div>
        <nav className="flex items-center gap-8 text-sm text-slate-300">
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
          <a href="#assets" className="hover:text-white transition">
            Assets
          </a>
          <Link
            href="/dashboard"
            className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-2 font-medium text-emerald-200 backdrop-blur hover:bg-emerald-400/20 transition"
          >
            Launch dashboard <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 pt-8 pb-16 max-w-[1400px] mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 border border-emerald-300/30 px-3 py-1 text-xs text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Live feed · auto-refreshing every 30s
          </div>
          <h1 className="mt-6 text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
            Predict the next
            <br />
            move across{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">DFM &amp;</span>
            <br />
            <span className="bg-gradient-to-r from-fuchsia-400 to-pink-300 bg-clip-text text-transparent">ADX equities.</span>
          </h1>
          <p className="mt-6 max-w-lg text-slate-400 leading-relaxed">
            DFM Signals streams price action for Dubai Financial Market and Abu Dhabi Exchange stocks, scores every
            session with an RNN + Random Forest + Gradient Boosting + XGBoost ensemble, and prints ATR-backed
            take-profit and stop-loss levels in real time.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_0_30px_rgba(64,220,180,0.35)] hover:bg-emerald-200 transition"
            >
              Open live terminal <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#works"
              className="inline-flex items-center gap-2 rounded-full border border-slate-600/60 px-6 py-3 text-sm font-medium text-slate-200 hover:border-slate-400 transition"
            >
              See how it works
            </a>
          </div>
          <div className="mt-12 flex gap-12">
            <Stat n="10" label="DFM & ADX STOCKS" />
            <Stat n="4" label="MODEL ENSEMBLE" />
            <Stat n="ATR" label="TP / SL ENGINE" />
          </div>
        </div>

        <HeroOrb />
      </section>

      <FloatingParticles />

      <LiveTickerTape />

      {/* FEATURE CARDS */}
      <section id="features" className="relative z-10 mx-auto max-w-[1400px] px-8 py-16 grid gap-6 md:grid-cols-3">
        <FeatureCard
          tag="SIGNALS"
          Icon={Activity}
          spark="#3fd6b0"
          title="Signal ensemble"
          body="A Vanilla RNN, Random Forest, Gradient Boosting and XGBoost vote together, with underperforming models automatically excluded."
        />
        <FeatureCard
          tag="EXECUTION"
          Icon={TrendingUp}
          spark="#f4a63a"
          title="ATR risk levels"
          body="Volatility-scaled take-profit and stop-loss, printed the moment a signal turns from HOLD to BUY or SELL, with live TP/SL tracking."
        />
        <FeatureCard
          tag="COVERAGE"
          Icon={LineChart}
          spark="#a888ff"
          title="Full DFM & ADX coverage"
          body="Emaar, Emirates NBD, DIB, du, DEWA, Salik, Mashreq auto-fetch live from Yahoo Finance; FAB, Aldar and ADCB via CSV upload."
        />
      </section>

      {/* ML ENSEMBLE MACHINE ANIMATION */}
      <ScrollEnsembleStory />
      <PipelineStepper />

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 flex items-center justify-between text-xs text-slate-500">
        <span>© DFM Signals · Research only, not financial advice.</span>
        <Link href="/dashboard" className="text-emerald-300 hover:text-emerald-200">
          Launch dashboard →
        </Link>
      </footer>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes floaty {
          0%,100% { transform: translate3d(0,0,0) rotate(var(--r, 0deg)); }
          25%     { transform: translate3d(6px,-10px,0) rotate(calc(var(--r, 0deg) + 2deg)); }
          50%     { transform: translate3d(0,-18px,0) rotate(var(--r, 0deg)); }
          75%     { transform: translate3d(-6px,-10px,0) rotate(calc(var(--r, 0deg) - 2deg)); }
        }
        @keyframes orbspin  { to { transform: rotate(360deg); } }
        @keyframes breathe  { 0%,100% { transform: scale(1); opacity: 0.55; } 50% { transform: scale(1.08); opacity: 0.85; } }
        @keyframes rise     { 0% { transform: translateY(20vh) scale(0.6); opacity: 0; } 10% { opacity: 0.6; } 90% { opacity: 0.6; } 100% { transform: translateY(-110vh) scale(1); opacity: 0; } }
        @keyframes drift    { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-12px,0); } }
        @keyframes gearspin { to { transform: rotate(360deg); } }
        @keyframes gearspinR { to { transform: rotate(-360deg); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes dashflow { to { stroke-dashoffset: -40; } }
        @keyframes barpulse { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes clusterswing { 0%,100% { transform: rotateY(-14deg) rotateX(4deg); } 50% { transform: rotateY(14deg) rotateX(-4deg); } }
        @keyframes cardfloat {
          0%,100% { translate: 0 0 0; }
          50%     { translate: 0 -14px 0; }
        }
        @keyframes sheen { 0% { transform: translateX(0); } 60% { transform: translateX(520%); } 100% { transform: translateX(520%); } }
        .parallax-wrap { transform: translate3d(var(--px, 0px), var(--py, 0px), 0); transition: transform 400ms cubic-bezier(.2,.7,.2,1); will-change: transform; }
      `}</style>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold text-white">{n}</div>
      <div className="mt-1 text-[10px] tracking-widest text-slate-500">{label}</div>
    </div>
  );
}

/* ─────────── Ticker tape — real prices, seamless triple-loop scroll ─────────── */

function LiveTickerTape() {
  const real = useRealTickers();
  const display: { s: string; p: string; m: string }[] = real.length
    ? real.map((t) => ({ s: t.symbol, p: t.price !== null ? fmtPrice(t.price, 2) : "—", m: t.exchange }))
    : [
        { s: "EMAAR", p: "—", m: "DFM" },
        { s: "ENBD", p: "—", m: "DFM" },
        { s: "DIB", p: "—", m: "DFM" },
        { s: "DU", p: "—", m: "DFM" },
        { s: "DEWA", p: "—", m: "DFM" },
        { s: "SALIK", p: "—", m: "DFM" },
        { s: "MASQ", p: "—", m: "DFM" },
        { s: "FAB", p: "—", m: "ADX" },
        { s: "ALDAR", p: "—", m: "ADX" },
        { s: "ADCB", p: "—", m: "ADX" },
      ];
  const stream = [...display, ...display, ...display];

  return (
    <div className="relative z-10 border-y border-white/5 bg-black/30 backdrop-blur-sm overflow-hidden">
      <div className="flex whitespace-nowrap animate-[ticker_50s_linear_infinite]">
        {stream.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-6 py-3 text-sm">
            <span className="font-semibold text-slate-200">{t.s}</span>
            <span className="text-slate-400">{t.p}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                t.m === "DFM" ? "bg-emerald-400/15 text-emerald-300" : "bg-fuchsia-400/15 text-fuchsia-300"
              }`}
            >
              {t.m}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── HERO ORB — interactive featured-ticker cluster with mouse parallax ─────────── */

type HeroAsset = {
  label: string;
  market: string;
  color: string;
  price: string;
  change: number;
  spark: number[];
};

const HERO_ASSET_LAYOUT = [
  { label: "DIB", color: "#f4a63a", seed: 1.2, fallbackTrend: 0.9 },
  { label: "DEWA", color: "#3ba9e6", seed: 2.4, fallbackTrend: 0.5 },
  { label: "SALIK", color: "#f26178", seed: 3.6, fallbackTrend: -0.4 },
  { label: "MASQ", color: "#3fd6a0", seed: 4.8, fallbackTrend: 1.2 },
  { label: "EMAAR", color: "#3fd6b0", seed: 6.0, fallbackTrend: 0.8 },
  { label: "ENBD", color: "#a888ff", seed: 7.2, fallbackTrend: -0.2 },
] as const;

const HERO_TILE_POSITIONS = [
  { x: -220, y: -138, z: -24, tilt: -16, rotate: -14, scale: 0.88 },
  { x: -250, y: 116, z: -12, tilt: -12, rotate: -10, scale: 0.9 },
  { x: -300, y: -20, z: -44, tilt: -8, rotate: -6, scale: 0.8 },
  { x: 230, y: -134, z: -20, tilt: 14, rotate: 12, scale: 0.88 },
  { x: 250, y: 118, z: -8, tilt: 18, rotate: 14, scale: 0.9 },
] as const;

function HeroFeaturedCard({ asset }: { asset: HeroAsset }) {
  const up = asset.change >= 0;
  const min = Math.min(...asset.spark);
  const max = Math.max(...asset.spark);
  const rng = Math.max(1, max - min);
  const path = asset.spark
    .map((v, i) => {
      const px = (i / (asset.spark.length - 1)) * 168 + 16;
      const py = 86 - ((v - min) / rng) * 54;
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div
      className="absolute left-1/2 top-1/2 z-20"
      style={{
        transform: "translate3d(-50%, -50%, 90px)",
        transformStyle: "preserve-3d",
        animation: "cardfloat 8s ease-in-out infinite",
      }}
    >
      <div
        className="relative h-[360px] w-[270px] overflow-hidden rounded-[34px] border border-white/10 backdrop-blur-xl transition-transform duration-700"
        style={{
          background: "linear-gradient(180deg, rgba(18,24,34,0.95) 0%, rgba(8,12,19,0.92) 100%)",
          boxShadow: `0 44px 90px -26px ${asset.color}55, 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${asset.color}, transparent)` }}
        />
        <div
          className="absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full opacity-90"
          style={{ background: `radial-gradient(circle, ${asset.color}50 0%, transparent 68%)`, filter: "blur(12px)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] tracking-[0.35em] text-slate-400">FEATURED TICKER</div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-black text-slate-950"
                  style={{
                    background: `linear-gradient(145deg, ${asset.color}, ${asset.color}cc)`,
                    boxShadow: `0 10px 25px -8px ${asset.color}aa`,
                  }}
                >
                  {asset.label}
                </div>
                <div>
                  <div className="text-2xl font-bold leading-none">{asset.label}</div>
                  <div className="mt-1 text-[11px] tracking-[0.3em] text-slate-400">{asset.market}</div>
                </div>
              </div>
            </div>
            <div
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                up ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {up ? "▲" : "▼"} {Math.abs(asset.change).toFixed(2)}%
            </div>
          </div>

          <div className="pt-3">
            <div className="text-[11px] tracking-[0.28em] text-slate-500">LIVE PRICE</div>
            <div className="mt-2 text-5xl font-black tracking-tight">${asset.price}</div>
            <div className="mt-4 flex items-center gap-2 text-[10px] tracking-[0.28em] text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              SESSION MOMENTUM
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-black/20 p-3">
            <svg viewBox="0 0 200 92" className="h-24 w-full overflow-visible">
              <defs>
                <linearGradient id={`hero-g-${asset.label}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={asset.color} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={asset.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${path} L184,92 L16,92 Z`} fill={`url(#hero-g-${asset.label})`} />
              <path d={path} fill="none" stroke={asset.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Realtime score</span>
              <span className="font-semibold text-slate-200">{up ? "Bullish tilt" : "Profit-taking"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSideTile({
  asset,
  position,
  onSelect,
}: {
  asset: HeroAsset;
  position: (typeof HERO_TILE_POSITIONS)[number];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute left-1/2 top-1/2 z-10 h-auto w-auto cursor-pointer rounded-[28px] border-none bg-transparent p-0"
      style={{
        transform: `translate3d(calc(${position.x}px - 50%), calc(${position.y}px - 50%), ${position.z}px) rotateY(${position.tilt}deg) rotateZ(${position.rotate}deg) scale(${position.scale})`,
        transformStyle: "preserve-3d",
      }}
      aria-label={`Show ${asset.label}`}
    >
      <div
        className="group relative flex h-[142px] w-[142px] items-center justify-center overflow-hidden rounded-[28px] border border-white/12 backdrop-blur-xl transition-transform duration-500 hover:scale-[1.04]"
        style={{
          background: "linear-gradient(180deg, rgba(248,247,241,0.96) 0%, rgba(240,240,234,0.9) 100%)",
          boxShadow: `0 26px 44px -24px ${asset.color}88, inset 0 1px 0 rgba(255,255,255,0.85)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle at 50% 45%, ${asset.color}33 0%, transparent 58%)` }}
        />
        <div className="relative text-center">
          <div
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-base font-black text-slate-950"
            style={{ background: `linear-gradient(145deg, ${asset.color}, ${asset.color}cc)` }}
          >
            {asset.label.slice(0, 2)}
          </div>
          <div className="mt-3 text-lg font-bold text-slate-900">{asset.label}</div>
          <div className="mt-1 text-[10px] tracking-[0.32em] text-slate-500">{asset.market}</div>
        </div>
      </div>
    </button>
  );
}

function HeroOrb() {
  const ref = useRef<HTMLDivElement>(null);
  useParallax(ref, 22);
  const real = useRealTickers();

  const floats: HeroAsset[] = HERO_ASSET_LAYOUT.map((c) => {
    const match = real.find((r) => r.symbol === c.label);
    const price = match?.price ?? null;
    const change = match?.changePct ?? c.fallbackTrend;
    return {
      label: c.label,
      market: "DFM",
      color: c.color,
      price: price !== null ? price.toFixed(2) : "—",
      change,
      spark: spark(c.seed, change >= 0 ? 0.8 : -0.5),
    };
  });

  const [activeLabel, setActiveLabel] = useState(floats[0]?.label ?? "DIB");

  useEffect(() => {
    const rotate = setInterval(() => {
      setActiveLabel((current) => {
        const currentIndex = floats.findIndex((item) => item.label === current);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % floats.length;
        return floats[nextIndex]?.label ?? current;
      });
    }, 4200);
    return () => clearInterval(rotate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [real.length]);

  const featured = floats.find((item) => item.label === activeLabel) ?? floats[0];
  const surrounding = floats.filter((item) => item.label !== featured.label);

  return (
    <div ref={ref} className="relative h-[560px] hidden lg:block parallax-wrap" style={{ perspective: "1200px" }}>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[440px] w-[440px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(64,220,180,0.35) 0%, rgba(64,220,180,0.15) 30%, rgba(168,136,255,0.12) 55%, transparent 72%)",
          filter: "blur(12px)",
          animation: "breathe 7s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full pointer-events-none"
        style={{ border: "1px dashed rgba(64,220,180,0.22)", transform: "rotateX(68deg)", animation: "orbspin 60s linear infinite" }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[340px] rounded-full pointer-events-none"
        style={{
          border: "1px dashed rgba(168,136,255,0.2)",
          transform: "rotateX(68deg)",
          animation: "orbspin 40s linear infinite reverse",
        }}
      />

      <div className="absolute left-1/2 -top-3 z-30 -translate-x-1/2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-2 py-2 backdrop-blur-xl">
          {floats.map((item) => {
            const active = item.label === featured.label;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveLabel(item.label)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] tracking-[0.22em] transition ${
                  active
                    ? "border-white/10 bg-white text-slate-950"
                    : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d", animation: "clusterswing 14s ease-in-out infinite", willChange: "transform" }}
      >
        <HeroFeaturedCard asset={featured} />
        {surrounding.map((item, index) => (
          <HeroSideTile
            key={item.label}
            asset={item}
            position={HERO_TILE_POSITIONS[index % HERO_TILE_POSITIONS.length]}
            onSelect={() => setActiveLabel(item.label)}
          />
        ))}
      </div>

      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[11px] tracking-[0.24em] text-slate-400 backdrop-blur-xl">
        <span className="text-emerald-300">◆</span>
        TAP A TILE TO BRING IT INTO FOCUS
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-slate-500 flex items-center gap-2">
        <span className="text-emerald-300">◆</span> MULTI-ASSET INTELLIGENCE, ONE TERMINAL
      </div>
    </div>
  );
}

function useParallax(ref: React.RefObject<HTMLElement | null>, strength = 18) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      el.style.setProperty("--px", `${dx * strength}px`);
      el.style.setProperty("--py", `${dy * strength}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [ref, strength]);
}

function EnsembleHalo({ size = 440 }: { size?: number }) {
  return (
    <>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          height: size,
          width: size,
          background:
            "radial-gradient(circle at 50% 50%, rgba(64,220,180,0.35) 0%, rgba(64,220,180,0.15) 30%, rgba(168,136,255,0.12) 55%, transparent 72%)",
          filter: "blur(12px)",
          animation: "breathe 7s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{ height: size * 0.86, width: size * 0.86, border: "1px dashed rgba(64,220,180,0.25)", animation: "orbspin 40s linear infinite" }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          height: size * 0.6,
          width: size * 0.6,
          border: "1px dashed rgba(168,136,255,0.2)",
          animation: "orbspin 25s linear infinite reverse",
        }}
      />
    </>
  );
}

/* ─────────── Ambient particles drifting upward across the page ─────────── */

function FloatingParticles() {
  const particles = Array.from({ length: 22 }).map((_, i) => {
    const left = Math.round((i * 47) % 100);
    const delay = (i * 1.7) % 18;
    const duration = 18 + ((i * 3) % 14);
    const size = 2 + (i % 4);
    const hue = i % 3 === 0 ? "rgba(168,136,255,0.5)" : "rgba(64,220,180,0.55)";
    return { left, delay, duration, size, hue, i };
  });
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.hue,
            boxShadow: `0 0 ${6 + p.size * 2}px ${p.hue}`,
            animation: `rise ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FeatureCard({
  tag,
  Icon,
  spark: sparkColor,
  title,
  body,
}: {
  tag: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  spark: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-sm hover:border-emerald-400/30 transition">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[10px] tracking-widest text-slate-400">
          <Icon className="h-3.5 w-3.5" style={{ color: sparkColor }} />
          {tag}
        </div>
        <svg width="80" height="20" viewBox="0 0 80 20">
          <polyline points="0,15 12,12 22,14 32,8 44,10 54,5 64,7 80,3" fill="none" stroke={sparkColor} strokeWidth="1.5" />
        </svg>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}

function BackgroundChart() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 900">
      <defs>
        <linearGradient id="line" x1="0" x2="1">
          <stop offset="0" stopColor="#3fd6b0" />
          <stop offset="1" stopColor="#a888ff" />
        </linearGradient>
      </defs>
      <path d="M0,700 Q200,650 400,600 T800,400 T1200,250 T1440,150" stroke="url(#line)" strokeWidth="2" fill="none" />
      <path d="M0,750 L1440,200" stroke="#e6b34a" strokeWidth="1" strokeDasharray="4 6" fill="none" opacity="0.5" />
      {Array.from({ length: 40 }).map((_, i) => {
        const x = i * 36;
        // Deterministic (not Math.random()) so server- and client-rendered
        // markup match — a random height here caused a hydration mismatch
        // under Next.js SSR. Rounded to 2dp too: Node's and the browser's V8
        // can round Math.sin's last bit differently, which by itself is
        // enough to trip React's hydration check at full float precision.
        const jitter = Math.sin(i * 3.7 + 1.1) * 10;
        const h = Math.round((30 + Math.sin(i * 0.6) * 20 + jitter + 10) * 100) / 100;
        const y = 500 - i * 8;
        return <rect key={i} x={x} y={y} width="6" height={h} fill="#3fd6b0" opacity="0.4" />;
      })}
    </svg>
  );
}

/* ─────────── ML ENSEMBLE MACHINE ─────────── */

type Corner = "tl" | "tr" | "bl" | "br";

type ModelDef = {
  name: string;
  role: string;
  detail: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  corner: Corner;
  weight: number;
};

const MODELS: ModelDef[] = [
  {
    name: "Vanilla RNN",
    role: "Sequence memory",
    detail: "Reads the last 30 candles as a time series to catch momentum shifts.",
    Icon: Brain,
    color: "#3fd6b0",
    corner: "tl",
    weight: 1.1,
  },
  {
    name: "Random Forest",
    role: "Rule ensemble",
    detail: "150 shallow decision trees vote on the next-bar direction.",
    Icon: GitBranch,
    color: "#f4a63a",
    corner: "tr",
    weight: 1.0,
  },
  {
    name: "Gradient Boosting",
    role: "Residual learner",
    detail: "100 trees added sequentially, each correcting the last one's errors.",
    Icon: TrendingUp,
    color: "#a888ff",
    corner: "bl",
    weight: 0.9,
  },
  {
    name: "XGBoost",
    role: "Regularized booster",
    detail: "150 regularized trees tuned to avoid overfitting on recent noise.",
    Icon: Zap,
    color: "#f26178",
    corner: "br",
    weight: 1.2,
  },
];

const STEPS = [
  { Icon: Database, label: "Ingest OHLCV", sub: "Yahoo Finance · 30s tick" },
  { Icon: Cpu, label: "Score 4 models", sub: "RNN · RF · GB · XGB" },
  { Icon: Filter, label: "Drop underperformers", sub: "Rolling accuracy gate" },
  { Icon: Scale, label: "Weighted vote", sub: "Majority + confidence" },
  { Icon: TrendingUp, label: "ATR TP / SL", sub: "Volatility-scaled levels" },
  { Icon: Send, label: "Emit signal", sub: "BUY · SELL · HOLD" },
];

const CORNER_POS: Record<Corner, { left: string; top: string; tx: string; ty: string }> = {
  tl: { left: "10%", top: "10%", tx: "0%", ty: "0%" },
  tr: { left: "90%", top: "10%", tx: "-100%", ty: "0%" },
  bl: { left: "10%", top: "90%", tx: "0%", ty: "-100%" },
  br: { left: "90%", top: "90%", tx: "-100%", ty: "-100%" },
};

const CORNER_ANCHOR: Record<Corner, { x: string; y: string }> = {
  tl: { x: "19%", y: "22%" },
  tr: { x: "81%", y: "22%" },
  bl: { x: "19%", y: "78%" },
  br: { x: "81%", y: "78%" },
};

type ModelVote = { vote: "BUY" | "SELL" | "HOLD"; conf: number };
type Signal = {
  symbol: string;
  market: string;
  price: number;
  votes: ModelVote[];
  ensemble: "BUY" | "SELL" | "HOLD";
  conf: number;
  tp: number;
  sl: number;
};

// Deterministic pseudo-random from a string seed — this whole section is an
// *explainer* of how the real ensemble is architected (real model names, real
// weighting concept), not a live signal feed. The actual /signal endpoint runs
// full model training per request, which is far too slow to poll every few
// seconds on a marketing page — so the rotating vote here is illustrative,
// seeded off the real fetched price so the numbers stay grounded in reality.
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function buildSignal(t: { symbol: string; price: number; exchange: string }, step: number): Signal {
  const rnd = seeded(t.symbol + ":" + step);
  const bias = rnd() * 2 - 1;
  const votes: ModelVote[] = MODELS.map((m) => {
    const noise = (rnd() * 2 - 1) * 0.35;
    const score = bias * m.weight + noise;
    const vote: ModelVote["vote"] = score > 0.25 ? "BUY" : score < -0.25 ? "SELL" : "HOLD";
    const conf = Math.min(0.97, Math.max(0.42, 0.55 + Math.abs(score) * 0.45));
    return { vote, conf: Number(conf.toFixed(2)) };
  });
  const tally: Record<ModelVote["vote"], number> = { BUY: 0, SELL: 0, HOLD: 0 };
  votes.forEach((v, i) => {
    tally[v.vote] += v.conf * MODELS[i].weight;
  });
  const keys: ModelVote["vote"][] = ["BUY", "SELL", "HOLD"];
  let ensemble: ModelVote["vote"] = "HOLD";
  let best = -Infinity;
  for (const k of keys) {
    if (tally[k] > best) {
      best = tally[k];
      ensemble = k;
    }
  }
  const total = tally.BUY + tally.SELL + tally.HOLD || 1;
  const conf = Number((best / total).toFixed(2));
  const atr = t.price * 0.014;
  const dir = ensemble === "SELL" ? -1 : 1;
  const tp = Number((t.price + dir * atr * 2.5).toFixed(2));
  const sl = Number((t.price - dir * atr * 1.6).toFixed(2));
  return { symbol: t.symbol, market: t.exchange, price: t.price, votes, ensemble, conf, tp, sl };
}

function useLiveSignal(real: RealTicker[]): Signal | null {
  const priced = useMemo(() => real.filter((t) => t.price !== null), [real]);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!priced.length) return;
    const rotate = setInterval(() => setIdx((i) => (i + 1) % priced.length), 4500);
    const reroll = setInterval(() => setStep((s) => s + 1), 2200);
    return () => {
      clearInterval(rotate);
      clearInterval(reroll);
    };
  }, [priced.length]);
  if (!priced.length) return null;
  const t = priced[idx % priced.length];
  return buildSignal({ symbol: t.symbol, price: t.price as number, exchange: t.exchange }, step + idx * 17);
}

function EnsembleCore({ signal }: { signal: Signal }) {
  const voteColor =
    signal.ensemble === "BUY"
      ? "from-emerald-300 to-cyan-400"
      : signal.ensemble === "SELL"
        ? "from-rose-300 to-fuchsia-400"
        : "from-amber-300 to-orange-400";
  const glow =
    signal.ensemble === "BUY" ? "rgba(64,220,180,0.6)" : signal.ensemble === "SELL" ? "rgba(242,97,120,0.6)" : "rgba(244,166,58,0.6)";
  const pill = signal.ensemble === "BUY" ? "text-emerald-200" : signal.ensemble === "SELL" ? "text-rose-200" : "text-amber-200";
  return (
    <div className="relative h-64 w-64">
      <svg viewBox="0 0 200 200" className="absolute inset-0" style={{ animation: "gearspin 20s linear infinite" }}>
        <Gear r={90} teeth={16} color="rgba(64,220,180,0.4)" />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute inset-6" style={{ animation: "gearspinR 14s linear infinite" }}>
        <Gear r={70} teeth={12} color="rgba(168,136,255,0.5)" />
      </svg>
      <div
        className={`absolute inset-12 rounded-full bg-gradient-to-br ${voteColor} ring-1 ring-slate-900/30 flex items-center justify-center transition-colors duration-500`}
        style={{ animation: "pulseGlow 2s ease-in-out infinite", boxShadow: `0 0 60px ${glow}` }}
      >
        <div className="text-center text-slate-900 px-3">
          <div className="text-[10px] font-extrabold tracking-[0.15em]">{signal.symbol} · ENSEMBLE</div>
          <div className="text-3xl font-black leading-none mt-1.5 tracking-tight">{signal.ensemble}</div>
          <div className="text-[11px] mt-1.5 font-bold">conf {signal.conf.toFixed(2)}</div>
          <div
            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold tracking-wider ${pill}`}
          >
            <span>TP {signal.tp.toFixed(2)}</span>
            <span className="opacity-40">·</span>
            <span>SL {signal.sl.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── SCROLL-TRIGGERED STORY: each model, then the ensemble result ─────────── */

function ScrollEnsembleStory() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const real = useRealTickers();
  const signal = useLiveSignal(real);
  // Continuous phase across 5 segments (0..3 = each model, 4 = ensemble).
  // We render with a smoothed phase so transitions between steps ease naturally
  // instead of snapping when a scroll frame lands mid-segment.
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let target = 0;
    let current = 0;
    let raf = 0;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const t = total > 0 ? scrolled / total : 0;
      target = t * 5;
    };
    const tick = () => {
      // Critically damped lerp for buttery cross-fades.
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0005) current = target;
      setPhase(current);
      raf = requestAnimationFrame(tick);
    };
    const onScroll = () => compute();
    compute();
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const step = Math.min(4, Math.max(0, Math.floor(phase)));
  const progress = Math.min(1, Math.max(0, phase - step));

  return (
    <section
      id="works"
      ref={wrapRef}
      className="relative z-10"
      style={{ height: "500vh" }}
      aria-label="How the ensemble builds a signal, step by step"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(900px 500px at 20% 15%, rgba(64,220,180,0.14), transparent 60%), radial-gradient(700px 500px at 85% 85%, rgba(168,136,255,0.14), transparent 60%), radial-gradient(1200px 600px at 50% 120%, rgba(15,60,55,0.5), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(64,220,180,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(64,220,180,0.6) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-[220px] bottom-0 pointer-events-none">
          <EnsembleHalo size={720} />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-8 pt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <Cpu className="h-3 w-3" /> Scroll to build the signal
          </div>
          <h2 className="mt-6 text-3xl lg:text-5xl font-bold tracking-tight">
            {step < 4 ? (
              <>
                Meet model <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">{step + 1} of 4</span>
              </>
            ) : (
              <>
                All four vote. <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">One verdict.</span>
              </>
            )}
          </h2>
          <div className="mx-auto mt-4 flex max-w-md items-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-white/10">
                  <div
                    className="h-full rounded-full transition-[width] duration-200"
                    style={{
                      width: done ? "100%" : active ? `${progress * 100}%` : "0%",
                      background: "linear-gradient(90deg,#3fd6b0,#a888ff)",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {!signal ? (
          <div className="relative z-10 mx-auto mt-14 max-w-2xl rounded-3xl border border-white/10 bg-white/[0.02] p-16 text-center text-sm text-slate-500">
            Waiting for live prices to animate the ensemble…
          </div>
        ) : (
          <div
            className="relative z-10 mx-auto mt-6 h-[calc(100vh-220px)] w-full max-w-[1400px] px-6"
            style={{ perspective: "1600px", perspectiveOrigin: "50% 50%" }}
          >
            <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
              {step < 4 ? (
                <ScrollModelFocus key={MODELS[step].name} model={MODELS[step]} vote={signal.votes[step]} symbol={signal.symbol} progress={progress} />
              ) : (
                <ScrollConverge signal={signal} progress={progress} />
              )}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-slate-500">
          {step < 4 ? "SCROLL ↓ NEXT MODEL" : "SCROLL ↓ TO CONTINUE"}
        </div>
      </div>
    </section>
  );
}

function ScrollModelFocus({
  model,
  vote,
  symbol,
  progress,
}: {
  model: ModelDef;
  vote: ModelVote;
  symbol: string;
  progress: number; // 0..1 within this step
}) {
  const { name, role, detail, Icon, color } = model;
  const voteColor = vote.vote === "BUY" ? "#3fd6b0" : vote.vote === "SELL" ? "#f26178" : "#f4a63a";
  // Map sub-progress to a signed distance-from-center: entry runs -1..0
  // during the first 18% of the step, hold at 0 through the middle, exit
  // runs 0..+1 during the final 18%. Because only one panel is on stage
  // at a time, the previous panel is already gone before the next mounts.
  const ENTER = 0.18;
  const EXIT = 0.82;
  let d = 0;
  if (progress < ENTER) d = -(1 - progress / ENTER);
  else if (progress > EXIT) d = (progress - EXIT) / (1 - EXIT);
  const abs = Math.min(1, Math.abs(d));
  const ease = 1 - Math.pow(abs, 2);
  const dir = d >= 0 ? 1 : -1;
  const rotY = dir * abs * 45;
  const rotX = -abs * 6;
  const tz = -abs * 320;
  const ty = dir * abs * 30;
  const opacity = ease;
  return (
    <div
      className="absolute inset-0 mx-auto flex items-center justify-center"
      style={{
        opacity,
        transformStyle: "preserve-3d",
        transform: `translate3d(0, ${ty}px, ${tz}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
        willChange: "transform, opacity",
        pointerEvents: abs > 0.3 ? "none" : "auto",
      }}
    >
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div style={{ transform: `translateZ(${ease * 40}px)` }}>
          <div className="text-[10px] tracking-[0.3em] text-slate-400">MODEL · {symbol}</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ background: `${color}22`, boxShadow: `0 0 30px ${color}55` }}>
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white">{name}</h3>
          </div>
          <div className="mt-2 text-xs uppercase tracking-[0.25em]" style={{ color }}>
            {role}
          </div>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">{detail}</p>

          <div className="mt-8 flex items-center gap-4">
            <div
              className="rounded-md px-3 py-1.5 text-sm font-black tracking-widest"
              style={{ background: `${voteColor}22`, color: voteColor, boxShadow: `0 0 24px ${voteColor}55` }}
            >
              {vote.vote}
            </div>
            <div className="text-sm text-slate-400">
              conf <span className="font-semibold text-white">{vote.conf.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-1 max-w-xs">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: i < Math.round(vote.conf * 12) ? color : `${color}22` }}
              />
            ))}
          </div>
        </div>

        <div
          className="relative h-[360px] w-full rounded-3xl border p-4"
          style={{
            background: `linear-gradient(140deg, ${color}18, transparent 60%)`,
            borderColor: `${color}55`,
            boxShadow: `0 40px 100px -20px ${color}66, inset 0 0 60px ${color}14`,
            transform: `translateZ(${ease * 80}px)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${color}55 1px,transparent 1px),linear-gradient(90deg,${color}55 1px,transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative h-full w-full">
            <ModelInternals model={model} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrollConverge({ signal, progress }: { signal: Signal; progress: number }) {
  // Final step resolves into the full assembled layout. Cards fly in from
  // deep Z-space, rotate to face the viewer and lock into the four-corner
  // composition around the core.
  const raw = Math.min(1, Math.max(0, progress * 1.15));
  const t = 1 - Math.pow(1 - raw, 3);
  return (
    <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
      <svg className="absolute inset-0 h-full w-full pointer-events-none">
        {MODELS.map((m, i) => {
          const a = CORNER_ANCHOR[m.corner];
          return (
            <line
              key={m.name}
              x1={a.x}
              y1={a.y}
              x2="50%"
              y2="50%"
              stroke={m.color}
              strokeOpacity={0.15 + t * 0.55}
              strokeWidth={1 + t * 1.5}
              strokeDasharray="4 8"
              style={{ animation: `dashflow ${1 + i * 0.15}s linear infinite` }}
            />
          );
        })}
      </svg>

      {MODELS.map((m, i) => {
        const p = CORNER_POS[m.corner];
        const cx = m.corner === "tl" || m.corner === "bl" ? 1 : -1;
        const cy = m.corner === "tl" || m.corner === "tr" ? 1 : -1;
        const tt = Math.min(1, Math.max(0, (t - i * 0.08) / (1 - 0.08 * 3)));
        const ease = 1 - Math.pow(1 - tt, 3);
        const dx = cx * (1 - ease) * 160;
        const dy = cy * (1 - ease) * 120;
        const tz = (1 - ease) * -420;
        const rotY = cx * (1 - ease) * -35;
        const rotX = cy * (1 - ease) * 18;
        const opacity = ease;
        const scale = 0.78 + ease * 0.22;
        return (
          <div
            key={m.name}
            className="absolute z-10 p-6"
            style={{
              left: p.left,
              top: p.top,
              transformStyle: "preserve-3d",
              transform: `translate(${p.tx}, ${p.ty}) translate3d(${dx}px, ${dy}px, ${tz}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`,
              opacity,
              willChange: "transform, opacity",
            }}
          >
            <div style={{ animation: `drift ${7 + i * 0.6}s ease-in-out ${i * 0.4}s infinite` }}>
              <ModelCard model={m} vote={signal.votes[i]} symbol={signal.symbol} delay={i * 0.35} />
            </div>
          </div>
        );
      })}

      <div
        className="absolute left-1/2 top-1/2 z-20"
        style={{
          opacity: 0.35 + t * 0.65,
          transform: `translate(-50%, -50%) scale(${0.8 + t * 0.2}) rotateZ(${(1 - t) * -8}deg)`,
          willChange: "transform, opacity",
        }}
      >
        <EnsembleCore signal={signal} />
      </div>

      <div className="absolute bottom-6 left-10 right-10 flex items-end justify-between gap-1 h-8 opacity-30 pointer-events-none">
        {Array.from({ length: 52 }).map((_, i) => (
          <div
            key={i}
            className="w-1 origin-bottom bg-gradient-to-t from-emerald-400/70 to-cyan-300/40"
            style={{ height: `${30 + ((i * 13) % 70)}%`, animation: `barpulse ${0.8 + (i % 5) * 0.15}s ease-in-out ${i * 0.03}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function PipelineStepper() {
  return (
    <section className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-8 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
          <Cpu className="h-3 w-3" /> Signal pipeline
        </div>
        <h2 className="mt-4 text-2xl lg:text-3xl font-bold tracking-tight">
          From tick to <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">signal</span>, in six steps.
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4"
            style={{ animation: `pulseGlow 6s ease-in-out ${i * 0.6}s infinite` }}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-emerald-400/15 p-1.5">
                <s.Icon className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <div className="text-[10px] tracking-widest text-slate-500">STEP {i + 1}</div>
            </div>
            <div className="mt-3 text-sm font-semibold text-white">{s.label}</div>
            <div className="mt-1 text-[11px] text-slate-400">{s.sub}</div>
            {i < STEPS.length - 1 && (
              <ArrowRight className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-emerald-300/60" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ModelCard({ model, vote: v, symbol, delay }: { model: ModelDef; vote: ModelVote; symbol: string; delay: number }) {
  const { name, role, detail, Icon, color } = model;
  const { vote, conf } = v;
  const voteColor = vote === "BUY" ? "#3fd6b0" : vote === "SELL" ? "#f26178" : "#f4a63a";
  return (
    <div
      className="w-[260px] max-w-full rounded-xl border p-4 backdrop-blur-md"
      style={
        {
          background: `linear-gradient(140deg, ${color}22, ${color}08)`,
          borderColor: `${color}66`,
          boxShadow: `0 10px 30px -5px ${color}55, 0 0 40px ${color}22`,
          animation: `floaty 5s ease-in-out ${delay}s infinite`,
          "--r": "0deg",
        } as React.CSSProperties
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="shrink-0 rounded-md p-1.5" style={{ background: `${color}33` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] tracking-widest text-slate-400">MODEL · {symbol}</div>
            <div className="truncate text-sm font-semibold text-white leading-tight">{name}</div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors duration-500" style={{ background: `${voteColor}22`, color: voteColor }}>
            {vote}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{conf.toFixed(2)}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-widest" style={{ color }}>
        {role}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{detail}</p>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-500"
            style={{
              background: i < Math.round(conf * 10) ? color : `${color}22`,
              animation: `pulseGlow ${1.2 + (i % 3) * 0.2}s ease-in-out ${i * 0.05}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Gear({ r, teeth, color }: { r: number; teeth: number; color: string }) {
  const cx = 100,
    cy = 100;
  const t: React.ReactNode[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const x = cx + Math.cos(a) * (r + 8);
    const y = cy + Math.sin(a) * (r + 8);
    t.push(<rect key={i} x={x - 4} y={y - 4} width="8" height="8" fill={color} transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} />);
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      {t}
    </g>
  );
}

// Shared gradient + glow defs that give every node a glossy, raised "puck"
// look instead of a flat stroked outline — this is what reads as "3D" rather
// than a flat 2D diagram.
function NodeDefs({ slug, color }: { slug: string; color: string }) {
  return (
    <defs>
      <radialGradient id={`puck-${slug}`} cx="35%" cy="28%" r="75%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="35%" stopColor={color} stopOpacity="1" />
        <stop offset="100%" stopColor={color} stopOpacity="0.55" />
      </radialGradient>
      <linearGradient id={`bar-${slug}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="18%" stopColor={color} stopOpacity="0.95" />
        <stop offset="100%" stopColor={color} stopOpacity="0.25" />
      </linearGradient>
      <filter id={`glow-${slug}`} x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="2.4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`shadow-${slug}`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
  );
}

function ModelInternals({ model }: { model: ModelDef }) {
  const { name, color } = model;
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  if (name === "Vanilla RNN") {
    return (
      <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
        <NodeDefs slug={slug} color={color} />
        {Array.from({ length: 6 }).map((_, i) => {
          const x = 30 + i * 65;
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
            >
              <motion.g
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.4 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              >
                <ellipse cx={x} cy={54} rx="15" ry="4" fill="#000" opacity="0.35" filter={`url(#shadow-${slug})`} />
                <rect x={x - 14} y={35} width="28" height="30" rx="7" fill={`url(#puck-${slug})`} filter={`url(#glow-${slug})`} />
                <rect x={x - 14} y={35} width="28" height="30" rx="7" fill="none" stroke="#fff" strokeOpacity="0.25" />
                <text x={x} y={54} fontSize="8" fontWeight="700" fill="#04211c" textAnchor="middle">
                  h{i}
                </text>
              </motion.g>
              <path
                d={`M ${x + 10} 35 C ${x + 20} 15, ${x - 20} 15, ${x - 10} 35`}
                stroke={color}
                strokeOpacity="0.55"
                fill="none"
                strokeDasharray="2 3"
                style={{ animation: `dashflow ${1 + i * 0.1}s linear infinite` }}
              />
              {i < 5 && (
                <line
                  x1={x + 14}
                  y1={50}
                  x2={x + 51}
                  y2={50}
                  stroke={color}
                  strokeOpacity="0.4"
                  strokeDasharray="2 4"
                  style={{ animation: `dashflow ${1 + i * 0.1}s linear infinite` }}
                />
              )}
            </motion.g>
          );
        })}
        <path id="rnn-path" d="M 10 50 L 390 50" fill="none" stroke="none" />
        <circle r="4" fill={color} filter={`url(#glow-${slug})`}>
          <animateMotion dur="2.2s" repeatCount="indefinite">
            <mpath href="#rnn-path" />
          </animateMotion>
        </circle>
        <text x="10" y="15" fontSize="8" fill={color} opacity="0.6">
          30-CANDLE SEQUENCE →
        </text>
      </svg>
    );
  }

  if (name === "Random Forest") {
    return (
      <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
        <NodeDefs slug={slug} color={color} />
        {Array.from({ length: 5 }).map((_, i) => {
          const cx = 40 + i * 80;
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
            >
              <motion.g
                animate={{ y: [0, -2.5, 0] }}
                transition={{ duration: 2.2 + i * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
              >
                <line x1={cx} y1={23} x2={cx - 18} y2={45} stroke={color} strokeOpacity="0.6" />
                <line x1={cx} y1={23} x2={cx + 18} y2={45} stroke={color} strokeOpacity="0.6" />
                <line x1={cx - 18} y1={51} x2={cx - 26} y2={70} stroke={color} strokeOpacity="0.4" />
                <line x1={cx - 18} y1={51} x2={cx - 10} y2={70} stroke={color} strokeOpacity="0.4" />
                <line x1={cx + 18} y1={51} x2={cx + 10} y2={70} stroke={color} strokeOpacity="0.4" />
                <line x1={cx + 18} y1={51} x2={cx + 26} y2={70} stroke={color} strokeOpacity="0.4" />
                <circle cx={cx} cy={20} r="4.5" fill={`url(#puck-${slug})`} filter={`url(#glow-${slug})`} />
                <circle cx={cx - 18} cy={48} r="3.5" fill={`url(#puck-${slug})`} />
                <circle cx={cx + 18} cy={48} r="3.5" fill={`url(#puck-${slug})`} />
              </motion.g>
              <circle r="2.5" fill={color} filter={`url(#glow-${slug})`}>
                <animateMotion dur={`${1.4 + i * 0.15}s`} repeatCount="indefinite" path={`M ${cx} 20 L ${cx - 26} 70 L ${cx} 92`} />
              </circle>
            </motion.g>
          );
        })}
        <text x="10" y="98" fontSize="8" fill={color} opacity="0.6">
          → MAJORITY VOTE
        </text>
      </svg>
    );
  }

  if (name === "Gradient Boosting") {
    return (
      <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
        <NodeDefs slug={slug} color={color} />
        {Array.from({ length: 7 }).map((_, i) => {
          const x = 30 + i * 50;
          const h = 20 + i * 8;
          return (
            <g key={i}>
              <ellipse cx={x} cy={81} rx="17" ry="3" fill="#000" opacity="0.3" filter={`url(#shadow-${slug})`} />
              <motion.rect
                x={x - 16}
                width="32"
                fill={`url(#bar-${slug})`}
                stroke={color}
                strokeOpacity="0.6"
                initial={{ y: 80, height: 0 }}
                whileInView={{ y: 80 - h, height: h }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              />
              <text x={x} y={92} fontSize="7" fill={color} textAnchor="middle" opacity="0.7">
                f{i}
              </text>
              {i < 6 && (
                <line
                  x1={x + 16}
                  y1={80 - h / 2}
                  x2={x + 34}
                  y2={80 - (h + 8) / 2}
                  stroke={color}
                  strokeOpacity="0.6"
                  strokeDasharray="2 3"
                  style={{ animation: `dashflow ${0.8 + i * 0.1}s linear infinite` }}
                />
              )}
            </g>
          );
        })}
        <text x="10" y="12" fontSize="8" fill={color} opacity="0.7">
          RESIDUAL STACK
        </text>
        <path id="gb-path" d="M 14 60 L 386 20" fill="none" stroke="none" />
        <circle r="4" fill={color} filter={`url(#glow-${slug})`}>
          <animateMotion dur="2.4s" repeatCount="indefinite">
            <mpath href="#gb-path" />
          </animateMotion>
        </circle>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
      <NodeDefs slug={slug} color={color} />
      {Array.from({ length: 4 }).map((_, i) => {
        const x = 40 + i * 95;
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0.75 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.09, ease: "easeOut" }}
          >
            <motion.g
              animate={{ y: [0, -2.5, 0] }}
              transition={{ duration: 2.3 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            >
              <line x1={x} y1={24} x2={x - 20} y2={50} stroke={color} strokeOpacity="0.7" />
              <line x1={x} y1={24} x2={x + 20} y2={50} stroke={color} strokeOpacity="0.7" />
              <circle cx={x} cy={20} r="5" fill={`url(#puck-${slug})`} filter={`url(#glow-${slug})`} />
              <rect x={x - 26} y={50} width="12" height="12" rx="3" fill={`url(#puck-${slug})`} opacity="0.9" />
              <rect x={x + 14} y={50} width="12" height="12" rx="3" fill={`url(#puck-${slug})`} opacity="0.9" />
              <rect
                x={x - 22}
                y={72}
                width="44"
                height="14"
                rx="7"
                fill="none"
                stroke={color}
                strokeOpacity="0.9"
                strokeDasharray="3 3"
                filter={`url(#glow-${slug})`}
              />
              <text x={x} y={82} fontSize="7" fill="#fff" fontWeight="600" textAnchor="middle" opacity="0.9">
                λ · reg
              </text>
            </motion.g>
            {i < 3 && (
              <line
                x1={x + 26}
                y1={79}
                x2={x + 69}
                y2={20}
                stroke={color}
                strokeOpacity="0.4"
                strokeDasharray="2 4"
                style={{ animation: `dashflow ${1 + i * 0.15}s linear infinite` }}
              />
            )}
            <circle r="3" fill={color} filter={`url(#glow-${slug})`}>
              <animateMotion dur={`${1.8 + i * 0.2}s`} repeatCount="indefinite" path={`M ${x} 20 L ${x + 20} 50 L ${x} 79 L ${x + 43} 20`} />
            </circle>
          </motion.g>
        );
      })}
    </svg>
  );
}

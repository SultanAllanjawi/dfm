"use client";

import { motion } from "framer-motion";
import { Target, ShieldAlert } from "lucide-react";
import { Panel } from "../Panel";
import { AnimatedNumber } from "../AnimatedNumber";
import { fmtPrice, signalColor } from "@/lib/format";
import type { SignalResponse } from "@/lib/types";

const SIGNAL_LABEL: Record<string, string> = { BUY: "BUY", SELL: "SELL", HOLD: "HOLD" };

export function TradingSignalCard({ signal }: { signal: SignalResponse }) {
  const color = signalColor(signal.signal.value);
  const accuracy = signal.ensemble.filteredAccuracy * 100;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const hasSignal = signal.signal.value !== "HOLD";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4 }}>
      <Panel className="relative overflow-hidden" tilt>
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ background: `radial-gradient(circle at 0% 0%, ${color}, transparent 60%)` }} />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Target className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-foreground">Trading Signals</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Today &mdash; {today} &middot; <span className="live-dot" /> <span className="text-[var(--buy)]">Live</span>
            </div>
            <motion.div
              key={signal.signal.value}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="mt-2 flex items-center gap-2"
            >
              <span
                className="spark-dot h-2.5 w-2.5"
                style={{ ["--dot-color" as string]: color, background: color, boxShadow: `0 0 12px ${color}` }}
              />
              <span
                className="pulse-glow text-3xl font-extrabold"
                style={{
                  color,
                  animationDuration: `${Math.max(0.9, 2.4 - Math.max(0.15, signal.signal.confidencePct / 100) * 1.6)}s`,
                }}
              >
                {SIGNAL_LABEL[signal.signal.value] ?? signal.signal.value}
              </span>
            </motion.div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 px-4 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Accuracy</div>
            <div className="text-xl font-extrabold text-foreground">
              <AnimatedNumber value={accuracy} decimals={1} suffix="%" />
            </div>
            <div className="text-[10px] text-muted-foreground">filtered</div>
          </div>
        </div>

        <div className="relative mt-3 flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-bold text-[var(--warn)]">
            <AnimatedNumber value={signal.signal.confidencePct} decimals={1} suffix="%" />
          </span>
          <span className="mx-1 text-border">|</span>
          <span className="text-muted-foreground">P(UP):</span>
          <span className="font-bold text-[var(--buy)]">
            <AnimatedNumber value={signal.signal.probUp} decimals={1} suffix="%" />
          </span>
        </div>

        <div className="relative my-4 h-px bg-border" />

        <div className="relative grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Live Price</div>
            <div className="mt-0.5 font-mono text-lg font-bold text-foreground">{fmtPrice(signal.price.display)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Entry</div>
            <div className="mt-0.5 font-mono text-lg font-bold text-[var(--buy)]">{fmtPrice(signal.signal.entry)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--buy)]">
              <Target className="h-3 w-3" /> Take Profit
            </div>
            {hasSignal ? (
              <div className="mt-0.5 font-mono text-lg font-bold text-[var(--buy)]">{fmtPrice(signal.signal.takeProfit)}</div>
            ) : (
              <div className="mt-2.5 h-0.5 w-10 rounded-full bg-secondary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--sell)]">
              <ShieldAlert className="h-3 w-3" /> Stop Loss
            </div>
            {hasSignal ? (
              <div className="mt-0.5 font-mono text-lg font-bold text-[var(--sell)]">{fmtPrice(signal.signal.stopLoss)}</div>
            ) : (
              <div className="mt-2.5 h-0.5 w-10 rounded-full bg-secondary" />
            )}
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              R/R: <span className="font-bold text-foreground">1:{signal.signal.riskReward.toFixed(2)}</span>
            </span>
            <span>
              ATR <span className="font-bold text-foreground">{((signal.signal.atr / signal.price.display) * 100).toFixed(2)}%</span>
            </span>
          </div>
          <span>Not financial advice</span>
        </div>
      </Panel>
    </motion.div>
  );
}

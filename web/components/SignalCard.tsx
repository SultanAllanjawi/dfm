"use client";

import { motion } from "framer-motion";
import { Panel } from "./Panel";
import { fmtPrice } from "@/lib/format";
import type { SignalResponse } from "@/lib/types";

const SIGNAL_META: Record<string, { emoji: string; label: string; color: string }> = {
  BUY: { emoji: "🟢", label: "BUY", color: "var(--buy)" },
  SELL: { emoji: "🔴", label: "SELL", color: "var(--sell)" },
  HOLD: { emoji: "⚪", label: "HOLD", color: "var(--muted-foreground)" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Signal active", color: "var(--warn)" },
  HIT_TP: { label: "Target hit", color: "var(--buy)" },
  HIT_SL: { label: "Stop loss hit", color: "var(--sell)" },
  EXPIRED: { label: "Signal expired", color: "var(--muted-foreground)" },
  NONE: { label: "No active signal", color: "var(--muted-foreground)" },
};

export function SignalCard({ signal }: { signal: SignalResponse }) {
  const meta = SIGNAL_META[signal.signal.value] ?? SIGNAL_META.HOLD;
  const status = STATUS_META[signal.activeSignalStatus.status] ?? STATUS_META.NONE;

  return (
    <Panel className="relative overflow-hidden" hover>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ background: `radial-gradient(circle at 100% 0%, ${meta.color}, transparent 60%)` }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trading Signal</div>
          <motion.div
            key={signal.signal.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
            className="mt-1 flex items-center gap-2 text-3xl font-extrabold"
            style={{ color: meta.color }}
          >
            {meta.emoji} {meta.label}
          </motion.div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Confidence</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[var(--warn)]">
            {signal.signal.confidencePct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full"
          style={{ background: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${signal.signal.confidencePct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Entry" value={fmtPrice(signal.signal.entry)} />
        <Metric label="Take Profit" value={fmtPrice(signal.signal.takeProfit)} color="var(--buy)" />
        <Metric label="Stop Loss" value={fmtPrice(signal.signal.stopLoss)} color="var(--sell)" />
        <Metric label="Risk / Reward" value={`1:${signal.signal.riskReward.toFixed(2)}`} />
      </div>

      <div className="relative mt-4 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
        <span className="font-medium" style={{ color: status.color }}>
          {status.label}
        </span>
        {signal.activeSignalStatus.message && (
          <span className="text-muted-foreground">&middot; {signal.activeSignalStatus.message}</span>
        )}
      </div>
    </Panel>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-bold" style={{ color: color ?? "var(--foreground)" }}>
        {value}
      </div>
    </div>
  );
}

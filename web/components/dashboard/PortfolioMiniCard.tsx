"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Panel } from "../Panel";
import { AnimatedNumber } from "../AnimatedNumber";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { fmtPct } from "@/lib/format";

const SLICE_COLORS = ["#2DD4BF", "#A78BFA", "#F59E0B", "#FB7185", "#38BDF8", "#64748B"];

export function PortfolioMiniCard() {
  const pfQ = useApi(() => api.getPortfolio(), []);
  const trades = (pfQ.data?.trades ?? []).filter((t) => t.status === "Open");
  const totalValue = trades.reduce((sum, t) => sum + t.entry * t.size, 0);
  const byTicker = new Map<string, number>();
  for (const t of trades) byTicker.set(t.ticker, (byTicker.get(t.ticker) ?? 0) + t.entry * t.size);
  const slices = Array.from(byTicker.entries())
    .map(([ticker, value]) => ({ ticker, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return (
    <Panel hover>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Portfolio</div>
        <Link href="/portfolio" className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
          Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {!pfQ.data || trades.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
          No open positions yet.
        </div>
      ) : (
        <>
          <div className="mt-1 text-2xl font-extrabold text-foreground">
            $<AnimatedNumber value={totalValue} decimals={0} />
          </div>
          <div className="text-xs font-semibold" style={{ color: (pfQ.data.summary.totalPnl ?? 0) >= 0 ? "var(--buy)" : "var(--sell)" }}>
            {(pfQ.data.summary.totalPnl ?? 0) >= 0 ? "+" : ""}
            {pfQ.data.summary.totalPnl.toFixed(2)} today ({fmtPct(pfQ.data.summary.roiPct)})
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full">
            {slices.map((s, i) => (
              <motion.div
                key={s.ticker}
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
              />
            ))}
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {slices.map((s, i) => (
              <motion.div
                key={s.ticker}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                  {s.ticker}
                </span>
                <span className="text-muted-foreground">{s.pct.toFixed(0)}%</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

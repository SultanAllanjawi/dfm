"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Panel } from "../Panel";
import { signalColor, fmtPrice } from "@/lib/format";
import type { ScannerResponse } from "@/lib/types";

export function TopMoversCard({ scan, onViewAll }: { scan: ScannerResponse | null; onViewAll: () => void }) {
  const movers = (scan?.results ?? []).filter((r) => !r.error && r.signal !== "HOLD").slice(0, 4);

  return (
    <Panel hover>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Top Movers</div>
        <button onClick={onViewAll} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
          Scanner <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {movers.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
          No scan run yet &mdash; open the Scanner tab to rank all 10 tickers by signal strength.
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {movers.map((m, i) => (
            <motion.div
              key={m.ticker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-center justify-between rounded-lg bg-secondary/40 px-2.5 py-1.5 transition-colors hover:bg-secondary/60"
            >
              <div>
                <div className="text-xs font-semibold text-foreground">{m.ticker}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{fmtPrice(m.price)}</div>
              </div>
              <span className="text-xs font-bold" style={{ color: signalColor(m.signal) }}>
                {m.signal} {m.confidencePct?.toFixed(0)}%
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </Panel>
  );
}

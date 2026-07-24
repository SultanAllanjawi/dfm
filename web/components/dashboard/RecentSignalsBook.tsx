"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { Panel } from "../Panel";
import type { SignalHistoryRow } from "@/lib/types";

export function RecentSignalsBook({ ticker, rows }: { ticker: string; rows: SignalHistoryRow[] }) {
  const buys = rows.filter((r) => r.Signal.includes("BUY")).slice(0, 8);
  const sells = rows.filter((r) => r.Signal.includes("SELL")).slice(0, 8);
  const maxLen = Math.max(buys.length, sells.length, 1);

  return (
    <Panel hover>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recent Signals</div>
        <div className="text-[10px] font-semibold text-muted-foreground">{ticker}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
        {Array.from({ length: maxLen }).map((_, i) => (
          <Fragment key={i}>
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex items-center justify-between rounded bg-[var(--buy)]/10 px-2 py-1 font-mono"
            >
              {buys[i] ? (
                <>
                  <span className="text-[var(--buy)]">{buys[i].Price.replace("$", "")}</span>
                  <span className="text-[10px] text-muted-foreground">{buys[i].Date.slice(5)}</span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex items-center justify-between rounded bg-[var(--sell)]/10 px-2 py-1 font-mono"
            >
              {sells[i] ? (
                <>
                  <span className="text-[10px] text-muted-foreground">{sells[i].Date.slice(5)}</span>
                  <span className="text-[var(--sell)]">{sells[i].Price.replace("$", "")}</span>
                </>
              ) : (
                <span className="ml-auto text-muted-foreground">—</span>
              )}
            </motion.div>
          </Fragment>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wide">
        <span className="text-[var(--buy)]">Buys</span>
        <span className="text-[var(--sell)]">Sells</span>
      </div>
    </Panel>
  );
}

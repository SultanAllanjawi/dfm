"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fmtPrice, fmtPct } from "@/lib/format";
import type { SignalResponse } from "@/lib/types";

export function HeroPrice({ signal, dataPoints }: { signal: SignalResponse; dataPoints: number }) {
  const up = signal.price.dayChangePct >= 0;
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="live-dot" />
        {signal.price.isLive ? "Live feed" : "Last close"} &middot; {signal.name}
      </div>
      <motion.div
        key={signal.price.display}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-1 flex items-baseline gap-3"
      >
        <span className="font-mono text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {fmtPrice(signal.price.display)}
        </span>
        <span
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${
            up ? "bg-[var(--buy)]/15 text-[var(--buy)]" : "bg-[var(--sell)]/15 text-[var(--sell)]"
          }`}
        >
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {fmtPct(signal.price.dayChangePct)}
        </span>
      </motion.div>
      <div className="mt-1.5 text-sm text-muted-foreground">{dataPoints.toLocaleString()} trading days of history</div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Panel } from "../Panel";
import { fmtPct } from "@/lib/format";
import type { SignalResponse } from "@/lib/types";

export function EnsembleAccuracyCard({ signal }: { signal: SignalResponse }) {
  const filtered = signal.ensemble.filteredAccuracy * 100;
  const raw = signal.ensemble.accuracy * 100;
  const delta = filtered - raw;
  const segments = 24;
  const filledSegments = Math.round((filtered / 100) * segments);

  return (
    <Panel hover>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Filtered Accuracy</div>
        <span className="text-[10px] font-semibold" style={{ color: delta >= 0 ? "var(--buy)" : "var(--sell)" }}>
          {fmtPct(delta)} vs raw
        </span>
      </div>
      <div className="mt-1 text-2xl font-extrabold text-foreground">{filtered.toFixed(1)}%</div>
      <div className="mt-3 flex gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => (
          <motion.div
            key={i}
            className="h-2.5 flex-1 rounded-sm"
            initial={{ opacity: 0, scaleY: 0.3, background: "var(--secondary)" }}
            animate={{
              opacity: 1,
              scaleY: 1,
              background: i < filledSegments ? "var(--primary)" : "var(--secondary)",
            }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          />
        ))}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        High-confidence signals only (P &ge; 60%) &middot; raw {raw.toFixed(1)}%
      </div>
    </Panel>
  );
}

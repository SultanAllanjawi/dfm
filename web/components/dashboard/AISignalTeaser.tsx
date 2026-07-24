"use client";

import { ChevronRight, Zap } from "lucide-react";
import type { SignalResponse } from "@/lib/types";
import { signalColor } from "@/lib/format";

export function AISignalTeaser({ signal, onClick }: { signal: SignalResponse; onClick: () => void }) {
  const recent = signal.signalHistory.filter((r) => {
    const d = new Date(r.Date);
    return !Number.isNaN(d.getTime()) && Date.now() - d.getTime() < 7 * 24 * 3600 * 1000;
  }).length;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 text-left transition-colors hover:from-primary/15"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Zap className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">
          {recent} setup{recent === 1 ? "" : "s"} detected this week
        </div>
        <div className="text-xs text-muted-foreground">
          Current signal:{" "}
          <span className="font-semibold" style={{ color: signalColor(signal.signal.value) }}>
            {signal.signal.value}
          </span>{" "}
          &middot; {signal.signal.confidencePct.toFixed(0)}% confidence
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

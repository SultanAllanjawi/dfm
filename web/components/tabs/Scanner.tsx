"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Panel, PanelLabel } from "../Panel";
import { EmptyState } from "../EmptyState";
import { Button } from "@/components/ui/button";
import { fmtPrice, signalColor } from "@/lib/format";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useDashboardStore } from "@/lib/store";
import type { ScannerResponse } from "@/lib/types";

export function Scanner() {
  const lastScan = useDashboardStore((s) => s.lastScan);
  const setLastScan = useDashboardStore((s) => s.setLastScan);
  const [data, setData] = useState<ScannerResponse | null>(lastScan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runScan(0.6);
      setData(res);
      setLastScan(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PanelLabel>Multi-Asset Signal Scanner</PanelLabel>
          <p className="text-xs text-muted-foreground">Trains all 10 DFM/ADX tickers and ranks by signal strength &middot; first scan takes ~60-90s</p>
        </div>
        <Button onClick={runScan} disabled={loading} className="gap-2">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {loading ? "Scanning…" : "Scan All Assets"}
        </Button>
      </Panel>

      {error && <EmptyState icon="⚠️" title="Scan failed" description={error} />}

      {!data && !loading && !error && (
        <EmptyState icon="🔀" title="No scan run yet" description="Click Scan All Assets to see live signals for every ticker in one view." />
      )}

      {data && (
        <>
          <Panel>
            <div className="grid grid-cols-4 gap-3 text-center">
              <Stat label="Scanned" value={String(data.summary.total)} />
              <Stat label="BUY" value={String(data.summary.buy)} color="var(--buy)" />
              <Stat label="SELL" value={String(data.summary.sell)} color="var(--sell)" />
              <Stat label="HOLD" value={String(data.summary.hold)} />
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="flex h-full">
                <div className="h-full bg-[var(--buy)]" style={{ width: `${(data.summary.buy / data.summary.total) * 100}%` }} />
                <div className="h-full bg-[var(--muted-foreground)]" style={{ width: `${(data.summary.hold / data.summary.total) * 100}%` }} />
                <div className="h-full bg-[var(--sell)]" style={{ width: `${(data.summary.sell / data.summary.total) * 100}%` }} />
              </div>
            </div>
            <div className="mt-2 text-center text-sm font-bold text-foreground">Market is {data.summary.bias}</div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {data.results.map((r, i) => (
                <motion.div
                  key={r.ticker}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Panel hover className="h-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-foreground">{r.ticker}</div>
                        <div className="text-xs text-muted-foreground">{r.name ?? ""}</div>
                      </div>
                      <div className="text-lg font-extrabold" style={{ color: signalColor(r.signal) }}>
                        {r.signal}
                      </div>
                    </div>
                    {r.error ? (
                      <div className="mt-3 text-xs text-[var(--sell)]">{r.error}</div>
                    ) : (
                      <>
                        <div className="mt-2 font-mono text-lg font-semibold text-foreground">{fmtPrice(r.price)}</div>
                        <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="text-right font-semibold text-[var(--warn)]">{r.confidencePct?.toFixed(1)}%</span>
                          <span className="text-muted-foreground">Take Profit</span>
                          <span className="text-right font-medium text-[var(--buy)]">{fmtPrice(r.takeProfit)}</span>
                          <span className="text-muted-foreground">Stop Loss</span>
                          <span className="text-right font-medium text-[var(--sell)]">{fmtPrice(r.stopLoss)}</span>
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className="text-right text-foreground">{r.accuracyPct?.toFixed(1)}%</span>
                        </div>
                      </>
                    )}
                  </Panel>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold" style={{ color: color ?? "var(--foreground)" }}>
        {value}
      </div>
    </div>
  );
}

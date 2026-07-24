"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { Panel, PanelLabel } from "../Panel";
import { EmptyState } from "../EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useDashboardStore } from "@/lib/store";
import type { BacktestResponse } from "@/lib/types";

export function Backtest({ ticker }: { ticker: string }) {
  const confidence = useDashboardStore((s) => s.confidence);
  const [capital, setCapital] = useState(1000);
  const [tradeSize, setTradeSize] = useState(100);
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runBacktest(ticker, { startingCapital: capital, tradeSizePct: tradeSize, confidence });
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const equityData = data?.equityCurve.map((v, i) => ({ trade: i, capital: v })) ?? [];
  const positive = (data?.metrics?.totalReturnPct ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <Panel>
        <PanelLabel>Backtest P&amp;L Calculator</PanelLabel>
        <p className="mb-3 text-xs text-muted-foreground">Simulates following every model signal historically, weighted by the model&apos;s filtered accuracy.</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Starting Capital ($)</Label>
            <Input type="number" value={capital} min={100} step={100} onChange={(e) => setCapital(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Trade Size ({tradeSize}% of capital)</Label>
            <Slider value={[tradeSize]} min={10} max={100} step={10} onValueChange={(v) => setTradeSize(Array.isArray(v) ? v[0] : v)} />
          </div>
          <Button onClick={run} disabled={loading} className="sm:w-40">
            {loading ? "Running…" : "Run Backtest"}
          </Button>
        </div>
      </Panel>

      {error && <EmptyState icon="⚠️" title="Backtest failed" description={error} />}
      {!data && !error && !loading && <EmptyState icon="📈" title="No backtest run yet" description="Configure your capital and trade size, then run the backtest." />}

      {data && data.metrics && (
        <>
          <Panel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Final Capital" value={`$${data.metrics.finalCapital.toLocaleString()}`} />
              <Stat label="Total Return" value={`${data.metrics.totalReturnPct >= 0 ? "+" : ""}${data.metrics.totalReturnPct.toFixed(1)}%`} color={positive ? "var(--buy)" : "var(--sell)"} />
              <Stat label="Win Rate" value={`${data.metrics.winRatePct.toFixed(1)}%`} />
              <Stat label="Max Drawdown" value={`-${data.metrics.maxDrawdownPct.toFixed(1)}%`} color="var(--sell)" />
              <Stat label="Total Trades" value={String(data.metrics.totalTrades)} />
            </div>
          </Panel>

          <Panel>
            <PanelLabel>Equity Curve</PanelLabel>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={equityData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? "#2DD4BF" : "#FB7185"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={positive ? "#2DD4BF" : "#FB7185"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} domain={["auto", "auto"]} />
                <ReferenceLine y={capital} stroke="#64748B" strokeDasharray="4 4" />
                <Tooltip contentStyle={{ background: "#10121C", border: "1px solid #1E2333", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="capital" stroke={positive ? "#2DD4BF" : "#FB7185"} fill="url(#equityFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel>
            <PanelLabel>Individual Trade Log</PanelLabel>
            <div className="scrollbar-thin max-h-[360px] overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead className="sticky top-0 bg-[var(--surface-2)]">
                  <tr>
                    {["Date", "Signal", "Entry", "Exit", "Result", "P&L $", "Capital"].map((h) => (
                      <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.trades.map((t, i) => (
                    <tr key={i} className="hover:bg-secondary/40">
                      <td className="border-b border-border/60 px-2.5 py-1.5 text-foreground">{t.date}</td>
                      <td className="border-b border-border/60 px-2.5 py-1.5">{t.signal}</td>
                      <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-foreground">${t.entry}</td>
                      <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-foreground">${t.exit}</td>
                      <td
                        className="border-b border-border/60 px-2.5 py-1.5 font-semibold"
                        style={{ color: t.result === "Win" ? "var(--buy)" : "var(--sell)" }}
                      >
                        {t.result === "Win" ? "✅ Win" : "❌ Loss"}
                      </td>
                      <td
                        className="border-b border-border/60 px-2.5 py-1.5 font-mono"
                        style={{ color: t.pnl >= 0 ? "var(--buy)" : "var(--sell)" }}
                      >
                        {t.pnl >= 0 ? "+" : ""}
                        {t.pnl}
                      </td>
                      <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-foreground">${t.capital.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <p className="text-center text-xs text-muted-foreground">
            ⚠️ Backtest uses the model&apos;s historical accuracy to simulate win/loss. Not financial advice.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-extrabold" style={{ color: color ?? "var(--foreground)" }}>
        {value}
      </div>
    </div>
  );
}

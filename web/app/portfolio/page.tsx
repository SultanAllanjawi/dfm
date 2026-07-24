"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Panel, PanelLabel } from "@/components/Panel";
import { EmptyState } from "@/components/EmptyState";
import { AddTradeDialog } from "@/components/AddTradeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/useApi";
import { api, ApiError } from "@/lib/api";
import { fmtPrice, fmtPct } from "@/lib/format";

export default function PortfolioPage() {
  const tickersQ = useApi(() => api.listTickers(), []);
  const portfolioQ = useApi(() => api.getPortfolio(), []);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitPrice, setExitPrice] = useState(0);

  async function closeTrade(id: string) {
    try {
      await api.closeTrade(id, exitPrice);
      toast.success("Trade closed");
      setClosingId(null);
      portfolioQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not close trade");
    }
  }

  async function deleteTrade(id: string) {
    try {
      await api.deleteTrade(id);
      toast.success("Trade deleted");
      portfolioQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete trade");
    }
  }

  const trades = portfolioQ.data?.trades ?? [];
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  const equityData = sorted.map((t, i) => {
    cum += t.pnl ?? 0;
    return { i, pnl: +cum.toFixed(2) };
  });

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">💼 Portfolio</h1>
            <p className="text-sm text-muted-foreground">Track which signals you acted on &middot; P&amp;L updates live</p>
          </div>
          {tickersQ.data && <AddTradeDialog tickers={tickersQ.data} onAdded={() => portfolioQ.refetch()} />}
        </div>

        {portfolioQ.loading && <Skeleton className="h-64 rounded-xl" />}

        {portfolioQ.data && trades.length === 0 && (
          <EmptyState icon="💼" title="No trades logged yet" description="Trades you add here track live P&L against your entry, TP and SL automatically." />
        )}

        {portfolioQ.data && trades.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Panel>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total Trades</div>
                <div className="mt-1 text-2xl font-extrabold text-foreground">{portfolioQ.data.summary.totalTrades}</div>
              </Panel>
              <Panel>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Open Positions</div>
                <div className="mt-1 text-2xl font-extrabold text-[var(--buy)]">{portfolioQ.data.summary.openPositions}</div>
              </Panel>
              <Panel>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total P&amp;L</div>
                <div className="mt-1 text-2xl font-extrabold" style={{ color: portfolioQ.data.summary.totalPnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
                  {portfolioQ.data.summary.totalPnl >= 0 ? "+" : ""}
                  {portfolioQ.data.summary.totalPnl.toLocaleString()}
                </div>
              </Panel>
              <Panel>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ROI</div>
                <div className="mt-1 text-2xl font-extrabold" style={{ color: portfolioQ.data.summary.roiPct >= 0 ? "var(--buy)" : "var(--sell)" }}>
                  {fmtPct(portfolioQ.data.summary.roiPct)}
                </div>
              </Panel>
            </div>

            <Panel>
              <PanelLabel>Portfolio Performance</PanelLabel>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={equityData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="i" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} />
                  <ReferenceLine y={0} stroke="#64748B" strokeDasharray="4 4" />
                  <Tooltip contentStyle={{ background: "#10121C", border: "1px solid #1E2333", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="pnl" stroke="#2DD4BF" fill="url(#pfFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            <Panel>
              <PanelLabel>Open &amp; Closed Trades</PanelLabel>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr>
                      {["Date", "Asset", "Side", "Entry", "Live/Exit", "P&L", "TP", "SL", "Status", ""].map((h) => (
                        <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {trades.map((t) => (
                        <motion.tr key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-secondary/40">
                          <td className="border-b border-border/60 px-2.5 py-2 text-foreground">{t.date}</td>
                          <td className="border-b border-border/60 px-2.5 py-2 font-medium text-foreground">{t.ticker}</td>
                          <td className="border-b border-border/60 px-2.5 py-2" style={{ color: t.side === "BUY" ? "var(--buy)" : "var(--sell)" }}>{t.side}</td>
                          <td className="border-b border-border/60 px-2.5 py-2 font-mono text-foreground">{fmtPrice(t.entry)}</td>
                          <td className="border-b border-border/60 px-2.5 py-2 font-mono text-foreground">{fmtPrice(t.livePrice)}</td>
                          <td className="border-b border-border/60 px-2.5 py-2 font-mono font-semibold" style={{ color: (t.pnl ?? 0) >= 0 ? "var(--buy)" : "var(--sell)" }}>
                            {(t.pnl ?? 0) >= 0 ? "+" : ""}{(t.pnl ?? 0).toFixed(2)} ({fmtPct(t.pnlPct)})
                          </td>
                          <td className="border-b border-border/60 px-2.5 py-2 font-mono text-[var(--buy)]">{fmtPrice(t.tp)}</td>
                          <td className="border-b border-border/60 px-2.5 py-2 font-mono text-[var(--sell)]">{fmtPrice(t.sl)}</td>
                          <td className="border-b border-border/60 px-2.5 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === "Open" ? "bg-[var(--warn)]/15 text-[var(--warn)]" : "bg-secondary text-muted-foreground"}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="border-b border-border/60 px-2.5 py-2">
                            {t.status === "Open" ? (
                              closingId === t.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    step="0.0001"
                                    value={exitPrice}
                                    onChange={(e) => setExitPrice(Number(e.target.value))}
                                    className="h-7 w-20 text-xs"
                                    placeholder="Exit $"
                                  />
                                  <button onClick={() => closeTrade(t.id)} className="text-[var(--buy)]"><Check className="h-4 w-4" /></button>
                                  <button onClick={() => setClosingId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setClosingId(t.id);
                                      setExitPrice(t.livePrice);
                                    }}
                                    className="text-xs font-medium text-primary hover:underline"
                                  >
                                    Close
                                  </button>
                                  <button onClick={() => deleteTrade(t.id)} className="text-xs font-medium text-muted-foreground hover:text-[var(--sell)]">
                                    Delete
                                  </button>
                                </div>
                              )
                            ) : (
                              <button onClick={() => deleteTrade(t.id)} className="text-xs font-medium text-muted-foreground hover:text-[var(--sell)]">
                                Delete
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}

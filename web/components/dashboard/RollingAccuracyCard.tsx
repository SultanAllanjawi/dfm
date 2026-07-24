"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { LineChart } from "lucide-react";
import { Panel, PanelLabel } from "../Panel";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";

export function RollingAccuracyCard({ ticker }: { ticker: string }) {
  const { data } = useApi(() => api.getAccuracyHistory(ticker), [ticker]);
  const history = data?.history ?? [];
  const series = history.map((h, i) => ({ i, v: h.filteredAccuracy * 100 }));
  const latest = series[series.length - 1]?.v;
  const first = series[0]?.v;
  const delta = series.length > 1 && first !== undefined && latest !== undefined ? latest - first : null;

  return (
    <Panel hover>
      <div className="flex items-center gap-2">
        <LineChart className="h-3.5 w-3.5 text-[var(--chart-3)]" />
        <PanelLabel dotColor="var(--chart-3)">Rolling Accuracy</PanelLabel>
      </div>
      {series.length < 2 ? (
        <div className="mt-1">
          <div className="text-xl font-extrabold text-foreground">{latest !== undefined ? `${latest.toFixed(1)}%` : "—"}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            First real data point recorded &mdash; this chart fills in as {ticker} gets retrained over time.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 h-14">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="accuracy-hist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area type="monotone" dataKey="v" stroke="#A78BFA" strokeWidth={1.5} fill="url(#accuracy-hist)" isAnimationActive animationDuration={1000} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{series.length} retrains recorded</span>
            <span className="font-semibold text-foreground">
              {latest?.toFixed(1)}% now
              {delta !== null && (
                <span className="ml-1" style={{ color: delta >= 0 ? "var(--buy)" : "var(--sell)" }}>
                  ({delta >= 0 ? "+" : ""}
                  {delta.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}

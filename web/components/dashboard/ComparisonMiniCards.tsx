"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Panel } from "../Panel";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { fmtPrice, fmtPct } from "@/lib/format";
import type { TickerInfo } from "@/lib/types";

function MiniPriceCard({ ticker, name, color }: { ticker: string; name: string; color: string }) {
  const priceQ = useApi(() => api.getPrice(ticker), [ticker]);
  const ohlcvQ = useApi(() => api.getOhlcv(ticker, 30), [ticker]);

  const bars = ohlcvQ.data?.bars ?? [];
  const data = bars.map((b, i) => ({ i, v: b.close }));
  const first = bars[0]?.close;
  const last = priceQ.data?.price ?? bars[bars.length - 1]?.close;
  const changePct = first && last ? ((last - first) / first) * 100 : 0;

  return (
    <Panel hover className="flex items-center gap-3 p-3">
      <div className="flex-1">
        <div className="text-xs font-semibold text-foreground">{name}</div>
        <div className="text-[10px] text-muted-foreground">{ticker} &middot; 30d</div>
        <div className="mt-1 font-mono text-sm font-bold text-foreground">{last ? fmtPrice(last) : "—"}</div>
        <div className="text-[11px] font-semibold" style={{ color: changePct >= 0 ? "var(--buy)" : "var(--sell)" }}>
          {fmtPct(changePct)}
        </div>
      </div>
      <div className="h-12 w-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={`cmp-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#cmp-${ticker})`} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function ComparisonMiniCards({ ticker, tickers }: { ticker: string; tickers: TickerInfo[] }) {
  const current = tickers.find((t) => t.ticker === ticker);
  const benchmark = tickers.find((t) => t.ticker !== ticker) ?? tickers[0];

  if (!current || !benchmark) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <MiniPriceCard ticker={current.ticker} name={current.name} color="#2DD4BF" />
      <MiniPriceCard ticker={benchmark.ticker} name={benchmark.name} color="#F59E0B" />
    </div>
  );
}

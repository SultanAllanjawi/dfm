"use client";

import { useState } from "react";
import { CandlestickChart, ExternalLink, TrendingUp } from "lucide-react";
import { Panel, PanelLabel } from "../Panel";
import { PriceChartCore, type ChartType } from "../PriceChartCore";
import type { SignalResponse } from "@/lib/types";

const LOOKBACK_OPTIONS = [30, 90, 180, 365, 1095];

export function LiveChart({ signal }: { signal: SignalResponse }) {
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [lookbackDays, setLookbackDays] = useState(180);

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <PanelLabel>Live Chart &middot; {signal.name}</PanelLabel>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-md bg-secondary p-0.5">
            <button
              onClick={() => setChartType("candles")}
              title="Candlestick chart"
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                chartType === "candles" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CandlestickChart className="h-3.5 w-3.5" /> Candles
            </button>
            <button
              onClick={() => setChartType("line")}
              title="Line chart"
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                chartType === "line" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Line
            </button>
          </div>
          <div className="flex gap-1">
            {LOOKBACK_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setLookbackDays(d)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  lookbackDays === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d >= 365 ? `${Math.round(d / 365)}Y` : `${d}D`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <PriceChartCore ticker={signal.ticker} signalHistory={signal.signalHistory} lookbackDays={lookbackDays} chartType={chartType} height={520} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 px-2 pb-1 text-xs text-muted-foreground">
        <a
          href="https://www.dfm.ae"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-accent"
        >
          DFM Official <ExternalLink className="h-3 w-3" />
        </a>
        {signal.investingSlug && (
          <a
            href={`https://www.investing.com/equities/${signal.investingSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-accent"
          >
            Investing.com <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </Panel>
  );
}

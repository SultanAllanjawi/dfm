"use client";

import { useState } from "react";
import { CandlestickChart, TrendingUp } from "lucide-react";
import { Panel, PanelLabel } from "../Panel";
import { PriceChartCore, type ChartType } from "../PriceChartCore";
import { useDashboardStore } from "@/lib/store";
import type { SignalHistoryRow } from "@/lib/types";

const LOOKBACK_OPTIONS = [30, 60, 90, 120, 180, 365];

export function PriceAndSignals({ ticker, signalHistory }: { ticker: string; signalHistory: SignalHistoryRow[] }) {
  const lookbackDays = useDashboardStore((s) => s.lookbackDays);
  const setLookbackDays = useDashboardStore((s) => s.setLookbackDays);
  const [chartType, setChartType] = useState<ChartType>("candles");

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PanelLabel>Price &amp; Signals</PanelLabel>
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
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <PriceChartCore ticker={ticker} signalHistory={signalHistory} lookbackDays={lookbackDays} chartType={chartType} height={420} />
      </div>
    </Panel>
  );
}

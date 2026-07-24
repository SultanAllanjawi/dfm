"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import type { SignalHistoryRow } from "@/lib/types";

export type ChartType = "candles" | "line";

function toTimestamp(dateStr: string): UTCTimestamp {
  return (Date.parse(dateStr.slice(0, 10) + "T00:00:00Z") / 1000) as UTCTimestamp;
}

/**
 * The model can stay convincingly bullish/bearish for many consecutive days,
 * so raw signalHistory often repeats the same call day after day (e.g. 10
 * SELLs in a row during one downtrend). Showing a marker on every one of
 * those days stacks arrows on top of each other and drowns out the chart —
 * collapse to one marker per new entry (only when the call flips direction).
 */
function dedupeToEntries(rows: SignalHistoryRow[]) {
  const sorted = [...rows].filter((r) => r.Date).sort((a, b) => a.Date.localeCompare(b.Date));
  const entries: { date: string; isBuy: boolean }[] = [];
  let prevDirection: boolean | null = null;
  for (const r of sorted) {
    const isBuy = r.Signal.includes("BUY");
    if (prevDirection === null || prevDirection !== isBuy) {
      entries.push({ date: r.Date, isBuy });
      prevDirection = isBuy;
    }
  }
  return entries;
}

export function PriceChartCore({
  ticker,
  signalHistory,
  lookbackDays,
  chartType,
  height = 420,
}: {
  ticker: string;
  signalHistory: SignalHistoryRow[];
  lookbackDays: number;
  chartType: ChartType;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null);

  const { data, loading, error } = useApi(() => api.getOhlcv(ticker, lookbackDays), [ticker, lookbackDays]);

  // Chart instance — recreated whenever chartType changes (candles vs line need
  // different series types, and lightweight-charts series can't be swapped in place).
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#94A3B8", fontSize: 11 },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.06)" },
        horzLines: { color: "rgba(148,163,184,0.06)" },
      },
      rightPriceScale: { borderColor: "#1E2333" },
      timeScale: { borderColor: "#1E2333" },
      crosshair: { mode: 0 },
      height,
      autoSize: true,
    });

    const series =
      chartType === "candles"
        ? chart.addSeries(CandlestickSeries, {
            upColor: "#2DD4BF",
            downColor: "#FB7185",
            borderVisible: false,
            wickUpColor: "#2DD4BF",
            wickDownColor: "#FB7185",
          })
        : chart.addSeries(LineSeries, {
            color: "#2DD4BF",
            lineWidth: 2,
          });

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => chart.applyOptions({ width: containerRef.current?.clientWidth });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [chartType, height]);

  useEffect(() => {
    if (!data || !seriesRef.current || !chartRef.current) return;
    const barTimes = new Set(data.bars.map((b) => toTimestamp(b.date)));

    if (chartType === "candles") {
      const bars = data.bars.map((b) => ({ time: toTimestamp(b.date), open: b.open, high: b.high, low: b.low, close: b.close }));
      (seriesRef.current as ISeriesApi<"Candlestick">).setData(bars);
    } else {
      const points = data.bars.map((b) => ({ time: toTimestamp(b.date), value: b.close }));
      (seriesRef.current as ISeriesApi<"Line">).setData(points);
    }

    const entries = dedupeToEntries(signalHistory).filter((e) => barTimes.has(toTimestamp(e.date)));
    const markers = entries.map((e) => ({
      time: toTimestamp(e.date),
      position: e.isBuy ? ("belowBar" as const) : ("aboveBar" as const),
      color: e.isBuy ? "#2DD4BF" : "#FB7185",
      shape: e.isBuy ? ("arrowUp" as const) : ("arrowDown" as const),
      text: e.isBuy ? "BUY" : "SELL",
    }));
    createSeriesMarkers(seriesRef.current, markers);
    chartRef.current.timeScale().fitContent();
  }, [data, signalHistory, chartType]);

  return (
    <div className="relative">
      {loading && <Skeleton className="w-full rounded-lg" style={{ height }} />}
      {error && <EmptyState icon="⚠️" title="Could not load chart data" description={error} />}
      <div ref={containerRef} className={loading || error ? "hidden" : "w-full"} style={{ height }} />
    </div>
  );
}

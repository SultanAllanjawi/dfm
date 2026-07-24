"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Panel, PanelLabel } from "../Panel";
import { EmptyState } from "../EmptyState";
import type { SignalResponse } from "@/lib/types";

export function PredictedVsActual({ signal }: { signal: SignalResponse }) {
  const data = signal.predictedVsActual;
  if (!data.length) return <EmptyState icon="📉" title="No prediction data available" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Panel>
        <PanelLabel>Predicted vs Actual Price</PanelLabel>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} minTickGap={40} axisLine={{ stroke: "#1E2333" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: "#10121C", border: "1px solid #1E2333", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#E2E8F0" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#E2E8F0" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#2DD4BF" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
      <Panel className="flex flex-col justify-center gap-4">
        <PanelLabel>Price Error</PanelLabel>
        <ErrorStat label="RMSE" value={signal.priceError.rmse} />
        <ErrorStat label="MAE" value={signal.priceError.mae} />
        <ErrorStat label="MAPE" value={signal.priceError.mape} suffix="%" />
      </Panel>
    </div>
  );
}

function ErrorStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-bold text-foreground">
        {value.toFixed(suffix ? 2 : 4)}
        {suffix}
      </div>
    </div>
  );
}

"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Panel } from "../Panel";
import { fmtPct } from "@/lib/format";

export function StatCard({
  label,
  value,
  deltaPct,
  color,
  series,
}: {
  label: string;
  value: string;
  deltaPct?: number;
  color: string;
  series: number[];
}) {
  const data = series.map((v, i) => ({ i, v }));
  const positive = (deltaPct ?? 0) >= 0;
  const gradientId = `spark-${label.replace(/\s+/g, "")}`;

  return (
    <Panel tilt className="relative overflow-hidden p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="spark-dot" style={{ ["--dot-color" as string]: color }} />
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold text-foreground">{value}</div>
      {deltaPct !== undefined && (
        <div className="mt-0.5 text-xs font-semibold" style={{ color: positive ? "var(--buy)" : "var(--sell)" }}>
          {fmtPct(deltaPct)}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Without an explicit domain, recharts defaults numeric axes to start
                at 0 — for values like 65% accuracy or $11 prices, that makes real
                day-to-day movement invisible (a tiny sliver against the 0-baseline).
                Scale to the series' own min/max instead, so the actual shape shows. */}
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

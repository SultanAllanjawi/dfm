"use client";

import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";
import { Panel } from "../Panel";
import { signalColor } from "@/lib/format";
import type { SignalResponse } from "@/lib/types";

export function SignalConfidenceCard({ signal }: { signal: SignalResponse }) {
  const color = signalColor(signal.signal.value);
  const data = signal.outlook7d.map((o, i) => ({ i, v: o.confidencePct }));
  const intensity = Math.max(0.15, signal.signal.confidencePct / 100);

  return (
    <Panel tilt>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Signal Confidence</div>
        <span
          className="pulse-glow flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{
            background: `${color}22`,
            color,
            borderColor: `${color}55`,
            boxShadow: `0 0 ${10 + intensity * 20}px ${color}${Math.floor(intensity * 150).toString(16).padStart(2, "0")}`,
            animationDuration: `${Math.max(0.9, 2.4 - intensity * 1.6)}s`,
          }}
        >
          <span className="spark-dot" style={{ ["--dot-color" as string]: color }} />
          {signal.signal.value}
        </span>
      </div>
      <div className="mt-1 text-2xl font-extrabold text-foreground">{signal.signal.confidencePct.toFixed(0)}%</div>
      <div className="text-xs text-muted-foreground">7-day decay &middot; P(Up) {signal.signal.probUp.toFixed(1)}%</div>
      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out">
              {data.map((_, i) => (
                <Cell key={i} fill={color} opacity={1 - i * 0.1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

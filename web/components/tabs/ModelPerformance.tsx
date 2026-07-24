"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from "recharts";
import { Panel, PanelLabel } from "../Panel";
import type { SignalResponse } from "@/lib/types";

export function ModelPerformance({ signal }: { signal: SignalResponse }) {
  const modelData = Object.entries(signal.modelMetrics).map(([name, m]) => ({
    name,
    Accuracy: +(m.accuracy * 100).toFixed(1),
    F1: +(m.f1 * 100).toFixed(1),
    AUC: +(m.auc * 100).toFixed(1),
  }));
  const cm = signal.confusionMatrix;
  const total = cm.flat().reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <PanelLabel>Per-Model Accuracy</PanelLabel>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={modelData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} unit="%" />
            <Tooltip contentStyle={{ background: "#10121C", border: "1px solid #1E2333", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="Accuracy" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-secondary px-2 py-1 text-muted-foreground">
            Best model: <span className="font-semibold text-foreground">{signal.ensemble.bestModel}</span>
          </span>
          <span className="rounded-md bg-secondary px-2 py-1 text-muted-foreground">
            Ensemble accuracy: <span className="font-semibold text-[var(--buy)]">{(signal.ensemble.accuracy * 100).toFixed(1)}%</span>
          </span>
          <span className="rounded-md bg-secondary px-2 py-1 text-muted-foreground">
            Filtered accuracy: <span className="font-semibold text-[var(--buy)]">{(signal.ensemble.filteredAccuracy * 100).toFixed(1)}%</span>
          </span>
        </div>
      </Panel>

      <Panel>
        <PanelLabel>ROC Curve</PanelLabel>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={signal.rocCurve} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" />
            <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} label={{ value: "False Positive Rate", position: "insideBottom", offset: -4, fontSize: 10, fill: "#94A3B8" }} />
            <YAxis dataKey="tpr" type="number" domain={[0, 1]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={{ stroke: "#1E2333" }} tickLine={false} />
            <Tooltip contentStyle={{ background: "#10121C", border: "1px solid #1E2333", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="tpr" stroke="#2DD4BF" strokeWidth={2} dot={false} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-center text-xs text-muted-foreground">
          AUC: <span className="font-semibold text-foreground">{signal.ensemble.auc.toFixed(3)}</span>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <PanelLabel>Confusion Matrix (Ensemble)</PanelLabel>
        <div className="mx-auto grid max-w-md grid-cols-[auto_1fr_1fr] gap-1 text-center text-sm">
          <div />
          <div className="pb-1 text-xs font-semibold text-muted-foreground">Pred. Down</div>
          <div className="pb-1 text-xs font-semibold text-muted-foreground">Pred. Up</div>

          <div className="flex items-center justify-center pr-2 text-xs font-semibold text-muted-foreground">Actual Down</div>
          <CmCell value={cm[0]?.[0] ?? 0} total={total} good />
          <CmCell value={cm[0]?.[1] ?? 0} total={total} />

          <div className="flex items-center justify-center pr-2 text-xs font-semibold text-muted-foreground">Actual Up</div>
          <CmCell value={cm[1]?.[0] ?? 0} total={total} />
          <CmCell value={cm[1]?.[1] ?? 0} total={total} good />
        </div>
      </Panel>
    </div>
  );
}

function CmCell({ value, total, good = false }: { value: number; total: number; good?: boolean }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const color = good ? "#2DD4BF" : "#FB7185";
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-4"
      style={{ background: `${color}${Math.round((0.08 + (pct / 100) * 0.18) * 255).toString(16).padStart(2, "0")}` }}
    >
      <div className="font-mono text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</div>
    </div>
  );
}

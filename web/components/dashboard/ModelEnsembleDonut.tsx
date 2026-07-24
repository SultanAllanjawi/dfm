"use client";

import { Panel } from "../Panel";
import { cn } from "@/lib/utils";
import type { SignalResponse } from "@/lib/types";

export function ModelEnsembleDonut({ signal }: { signal: SignalResponse }) {
  const used = signal.ensemble.modelsUsed;
  const excluded = signal.ensemble.modelsExcluded;
  const models = [...used, ...excluded];
  const activeCount = used.length;

  return (
    <Panel tilt>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Model Ensemble</div>
      <div className="relative mt-3 flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0" style={{ perspective: "700px" }}>
          <div className="spin-3d relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
            {models.map((name, i) => {
              const on = i < activeCount;
              const angle = (360 / models.length) * i;
              const color = on ? "#2DD4BF" : "#334155";
              return (
                <div
                  key={name}
                  className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-md border transition-[background,box-shadow] duration-300"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(50px)`,
                    borderColor: color,
                    background: on
                      ? "linear-gradient(135deg, rgba(45,212,191,0.35), rgba(45,212,191,0.05))"
                      : "rgba(30,41,59,0.4)",
                    boxShadow: on ? `0 0 16px ${color}` : "none",
                  }}
                />
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-extrabold text-foreground">
              {activeCount}/{models.length}
            </div>
            <div className="text-[9px] text-muted-foreground">in use</div>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 text-xs">
          {models.map((name, i) => {
            const on = i < activeCount;
            return (
              <div key={name} className={cn("flex items-center gap-1.5", on ? "text-foreground" : "text-muted-foreground line-through")}>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: on ? "var(--buy)" : "var(--secondary)",
                    boxShadow: on ? "0 0 6px var(--buy)" : "none",
                  }}
                />
                {name}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Best model: <span className="font-semibold text-foreground">{signal.ensemble.bestModel}</span>
      </div>
    </Panel>
  );
}

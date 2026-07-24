"use client";

import { Panel, PanelLabel } from "../Panel";
import { EmptyState } from "../EmptyState";
import { signalColor } from "@/lib/format";
import type { SignalHistoryRow } from "@/lib/types";

export function SignalHistory({ rows }: { rows: SignalHistoryRow[] }) {
  if (!rows.length) return <EmptyState icon="🕓" title="No signal history yet" />;

  return (
    <Panel>
      <PanelLabel>Signal History ({rows.length})</PanelLabel>
      <div className="scrollbar-thin max-h-[480px] overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead className="sticky top-0 bg-[var(--surface-2)]">
            <tr>
              {["Date", "Price", "Signal", "P(Up)", "Confidence"].map((h) => (
                <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-secondary/40">
                <td className="border-b border-border/60 px-2.5 py-1.5 text-foreground">{r.Date}</td>
                <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-foreground">{r.Price}</td>
                <td className="border-b border-border/60 px-2.5 py-1.5 font-semibold" style={{ color: signalColor(r.Signal) }}>
                  {r.Signal}
                </td>
                <td className="border-b border-border/60 px-2.5 py-1.5 text-foreground">{r["P(UP)"]}</td>
                <td className="border-b border-border/60 px-2.5 py-1.5 text-[var(--warn)]">{r.Confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

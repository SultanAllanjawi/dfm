"use client";

import { motion } from "framer-motion";
import { Panel, PanelLabel } from "./Panel";
import { fmtPrice, signalColor } from "@/lib/format";
import type { OutlookDay } from "@/lib/types";

export function SevenDayOutlook({ outlook }: { outlook: OutlookDay[] }) {
  const buys = outlook.filter((o) => o.signal === "BUY").length;
  const sells = outlook.filter((o) => o.signal === "SELL").length;
  const bias = buys > sells ? "📈 BULLISH" : sells > buys ? "📉 BEARISH" : "➡️ SIDEWAYS";

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <PanelLabel>7-Day Forward Outlook</PanelLabel>
        <span className="text-xs font-semibold text-muted-foreground">{bias}</span>
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              {["Date", "Signal", "Conf.", "Entry", "Take Profit", "Stop Loss", "R/R"].map((h) => (
                <th
                  key={h}
                  className="border-b border-border px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outlook.map((row, i) => (
              <motion.tr
                key={row.date}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="hover:bg-secondary/40"
              >
                <td className="border-b border-border/60 px-2.5 py-2 text-foreground">{row.label}</td>
                <td className="border-b border-border/60 px-2.5 py-2 font-semibold" style={{ color: signalColor(row.signal) }}>
                  {row.signal}
                </td>
                <td className="border-b border-border/60 px-2.5 py-2 text-foreground">{row.confidencePct.toFixed(0)}%</td>
                <td className="border-b border-border/60 px-2.5 py-2 font-mono text-foreground">{fmtPrice(row.entry)}</td>
                <td className="border-b border-border/60 px-2.5 py-2 font-mono font-medium text-[var(--buy)]">
                  {fmtPrice(row.takeProfit)}
                </td>
                <td className="border-b border-border/60 px-2.5 py-2 font-mono font-medium text-[var(--sell)]">
                  {fmtPrice(row.stopLoss)}
                </td>
                <td className="border-b border-border/60 px-2.5 py-2 text-foreground">
                  {row.riskReward ? `1:${row.riskReward.toFixed(2)}` : "—"}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

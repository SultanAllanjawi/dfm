"use client";

import { motion } from "framer-motion";
import { StatCard } from "./StatCard";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import type { SignalResponse } from "@/lib/types";

export function StatRow({ ticker, signal }: { ticker: string; signal: SignalResponse }) {
  const ohlcvQ = useApi(() => api.getOhlcv(ticker, 20), [ticker]);
  const bars = ohlcvQ.data?.bars ?? [];

  const volumes = bars.length ? bars.map((b) => b.volume) : [0];
  const closes = bars.length ? bars.map((b) => b.close) : [signal.price.display];
  const lastVolume = volumes[volumes.length - 1] ?? 0;
  const volDeltaPct = volumes.length > 1 ? ((lastVolume - volumes[0]) / (volumes[0] || 1)) * 100 : 0;

  const modelAccuracies = Object.values(signal.modelMetrics).map((m) => m.accuracy * 100);
  const modelAucs = Object.values(signal.modelMetrics).map((m) => m.auc * 100);
  const outlookConf = signal.outlook7d.map((o) => o.confidencePct);

  const cards = [
    { label: "Day Volume", value: lastVolume.toLocaleString(undefined, { maximumFractionDigits: 1 }), deltaPct: volDeltaPct, color: "#2DD4BF", series: volumes },
    { label: "Model Accuracy", value: `${(signal.ensemble.accuracy * 100).toFixed(1)}%`, color: "#F59E0B", series: modelAccuracies.length ? modelAccuracies : [0] },
    { label: "AUC Score", value: signal.ensemble.auc.toFixed(3), color: "#A78BFA", series: modelAucs.length ? modelAucs : [0] },
    {
      label: "Confidence Decay",
      value: `${signal.signal.confidencePct.toFixed(0)}%`,
      deltaPct: outlookConf.length > 1 ? outlookConf[outlookConf.length - 1] - outlookConf[0] : 0,
      color: "#FB7185",
      series: outlookConf.length ? outlookConf : [signal.signal.confidencePct],
    },
    { label: "History", value: `${signal.dataPoints.toLocaleString()}d`, color: "#38BDF8", series: closes },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => (
        <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }}>
          <StatCard {...c} />
        </motion.div>
      ))}
    </div>
  );
}

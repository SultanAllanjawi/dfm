import { create } from "zustand";
import type { ScannerResponse } from "./types";

type DashboardState = {
  ticker: string;
  setTicker: (t: string) => void;
  confidence: number;
  setConfidence: (c: number) => void;
  lookbackDays: number;
  setLookbackDays: (n: number) => void;
  lastScan: ScannerResponse | null;
  setLastScan: (s: ScannerResponse) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ticker: "EMAAR.DFM",
  setTicker: (t) => set({ ticker: t }),
  confidence: 0.6,
  setConfidence: (c) => set({ confidence: c }),
  lookbackDays: 90,
  setLookbackDays: (n) => set({ lookbackDays: n }),
  lastScan: null,
  setLastScan: (s) => set({ lastScan: s }),
}));

"use client";

import { Calculator } from "lucide-react";
import { Panel, PanelLabel } from "../Panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { SignalResponse } from "@/lib/types";

export function PositionSizeCalculator({ signal }: { signal: SignalResponse }) {
  const [accountSize, setAccountSize] = useLocalStorage("dfm-calc-account", 10000);
  const [riskPct, setRiskPct] = useLocalStorage("dfm-calc-risk", 1.5);

  const hasSignal = signal.signal.value !== "HOLD" && signal.signal.stopLoss !== null;
  const stopDistance = hasSignal ? Math.abs(signal.signal.entry - (signal.signal.stopLoss as number)) : signal.signal.atr;
  const riskAmount = accountSize * (riskPct / 100);
  const shares = stopDistance > 0 ? Math.floor(riskAmount / stopDistance) : 0;
  const positionValue = shares * signal.signal.entry;
  const positionPct = accountSize > 0 ? (positionValue / accountSize) * 100 : 0;

  return (
    <Panel hover>
      <div className="flex items-center gap-2">
        <Calculator className="h-3.5 w-3.5 text-primary" />
        <PanelLabel>Position Size Calculator</PanelLabel>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Account size</Label>
          <Input
            type="number"
            value={accountSize}
            min={100}
            step={100}
            onChange={(e) => setAccountSize(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Risk per trade (%)</Label>
          <Input
            type="number"
            value={riskPct}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-1.5 border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">Risk amount</span>
        <span className="text-right font-mono text-foreground">${riskAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span className="text-muted-foreground">Stop distance {hasSignal ? "" : "(ATR est.)"}</span>
        <span className="text-right font-mono text-foreground">${stopDistance.toFixed(4)}</span>
        <span className="text-muted-foreground">Position value</span>
        <span className="text-right font-mono text-foreground">${positionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Shares to buy</span>
        <span className="text-xl font-extrabold text-primary">{shares.toLocaleString()}</span>
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">{positionPct.toFixed(1)}% of account at {signal.ticker}&apos;s current entry</div>
    </Panel>
  );
}

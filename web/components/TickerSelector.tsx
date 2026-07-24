"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { TickerInfo } from "@/lib/types";

export function TickerSelector({
  tickers,
  value,
  onChange,
}: {
  tickers: TickerInfo[];
  value: string;
  onChange: (t: string) => void;
}) {
  const dfm = tickers.filter((t) => t.exchange === "DFM");
  const adx = tickers.filter((t) => t.exchange === "ADX");

  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-[240px] bg-card">
        <SelectValue placeholder="Select a stock" />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Dubai Financial Market
        </div>
        {dfm.map((t) => (
          <SelectItem key={t.ticker} value={t.ticker}>
            <span className="flex w-full items-center justify-between gap-3">
              <span>{t.name}</span>
              <span className="text-xs text-muted-foreground">{t.ticker}</span>
            </span>
          </SelectItem>
        ))}
        <div className="mt-1 border-t border-border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Abu Dhabi Exchange
        </div>
        {adx.map((t) => (
          <SelectItem key={t.ticker} value={t.ticker}>
            <span className="flex w-full items-center justify-between gap-3">
              <span>{t.name}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {t.ticker}
                {!t.autoFetch && (
                  <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal">
                    CSV
                  </Badge>
                )}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
